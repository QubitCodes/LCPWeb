import { Order, OrderItem, Payment, LevelEnrollment, CourseLevel, User, Company, Course } from '../models';
import sequelize from '../lib/sequelize';
import { AuditService } from '../services/AuditService';
import { Op } from 'sequelize';

interface CreateOrderItem {
  worker_id: string;
  course_level_id: string;
  price: number;
}

export class OrderController {
  
  static async listEnrollments() {
    const enrollments = await LevelEnrollment.findAll({
      include: [
        { model: User, as: 'worker', attributes: ['first_name', 'last_name', 'email'] },
        { 
          model: CourseLevel, 
          as: 'level', 
          attributes: ['level_number', 'title'],
          include: [{ model: Course, as: 'course', attributes: ['title'] }] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
    return { success: true, data: enrollments, code: 100 };
  }

  static async createOrder(
    userId: string, 
    companyId: string | null, 
    items: CreateOrderItem[], 
    actorId: string
  ) {
    const t = await sequelize.transaction();
    
    try {
      // VALIDATE ELIGIBILITY FOR EACH ITEM
      for (const item of items) {
        await this.validateEligibility(item.worker_id, item.course_level_id);
      }

      // Calculate Total
      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

      // 1. Create Order
      const order = await Order.create({
        user_id: userId,
        company_id: companyId || undefined,
        total_amount: totalAmount,
        currency: 'USD',
        status: 'PENDING'
      }, { transaction: t });

      // 2. Create Items
      for (const item of items) {
        await OrderItem.create({
          order_id: order.id,
          worker_id: item.worker_id,
          course_level_id: item.course_level_id,
          price: item.price
        }, { transaction: t });
      }

      await t.commit();
      
      await AuditService.log({
        userId: actorId,
        action: 'CREATE_ORDER',
        entityType: 'ORDER',
        entityId: order.id,
        details: { total: totalAmount, itemsCount: items.length }
      });

      return { success: true, data: order, code: 101 };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // Enrollment Logic Logic
  private static async validateEligibility(workerId: string, courseLevelId: string) {
    // 0. CHECK DUPLICATE ACTIVE ENROLLMENT
    const existingActive = await LevelEnrollment.findOne({
      where: {
        worker_id: workerId,
        course_level_id: courseLevelId,
        status: 'ACTIVE'
      }
    });
    if (existingActive) {
      throw new Error(`Worker is already actively enrolled in this level.`);
    }

    // 0.1 Check if already completed (unless specific re-take logic, usually we don't allow paying again for passed level)
    const existingCompleted = await LevelEnrollment.findOne({
      where: {
        worker_id: workerId,
        course_level_id: courseLevelId,
        status: 'COMPLETED'
      }
    });
    if (existingCompleted) {
      throw new Error(`Worker has already completed this level.`);
    }

    const targetLevel = await CourseLevel.findByPk(courseLevelId);
    if (!targetLevel) throw new Error('Course level not found');

    const worker = await User.findByPk(workerId);
    if (!worker) throw new Error('Worker not found');

    // Level 1: Open to all
    if (targetLevel.level_number === 1) return true;

    // Levels 2, 3, 4 REQUIRE previous level completion
    const prevLevelNum = targetLevel.level_number - 1;
    
    // Find previous level definition for this course
    const prevLevelDef = await CourseLevel.findOne({
      where: { course_id: targetLevel.course_id, level_number: prevLevelNum }
    });
    if (!prevLevelDef) throw new Error('Previous level definition missing');

    // Check if worker completed previous level
    const prevEnrollment = await LevelEnrollment.findOne({
      where: {
        worker_id: workerId,
        course_level_id: prevLevelDef.id,
        status: 'COMPLETED'
      }
    });

    if (!prevEnrollment) {
      throw new Error(`Worker must complete Level ${prevLevelNum} first.`);
    }

    // WAITING PERIOD CHECK
    const completionDate = new Date(prevEnrollment.completion_date);
    const twoYearsLater = new Date(completionDate);
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
    const now = new Date();

    // Check Exceptions (Fast Track)
    if (targetLevel.level_number === 2 && targetLevel.fast_track_experience_required !== null) {
      if ((worker.years_experience || 0) >= targetLevel.fast_track_experience_required) {
         return true;
      }
    }

    if (now < twoYearsLater) {
      throw new Error(`Eligibility mismatch: Must wait 2 years after Level ${prevLevelNum} completion.`);
    }

    return true;
  }

  static async processPayment(orderId: string, provider: 'MANUAL' | 'STRIPE', amount: number, proof?: string) {
    const t = await sequelize.transaction();
    
    try {
      const order = await Order.findByPk(orderId);
      if (!order) throw new Error('Order not found');

      // 1. Record Payment
      const payment = await Payment.create({
        order_id: orderId,
        provider,
        amount,
        status: provider === 'MANUAL' ? 'PENDING' : 'APPROVED', 
        proof_document_url: proof
      }, { transaction: t });

      // If Stripe, approve immediately. If Manual, wait for admin.
      if (provider === 'STRIPE') {
        await this.activateOrder(order, t);
      }

      await t.commit();
      return { 
        success: true, 
        message: provider === 'MANUAL' ? 'Payment submitted for approval' : 'Payment successful', 
        code: 100 
      };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async approveManualPayment(paymentId: string, adminId: string) {
    const t = await sequelize.transaction();
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) throw new Error('Payment not found');
      if (payment.status !== 'PENDING') throw new Error('Payment not pending');

      await payment.update({ status: 'APPROVED' }, { transaction: t });
      
      const order = await Order.findByPk(payment.order_id, { include: [{ model: OrderItem, as: 'items' }] });
      if (order) {
        await this.activateOrder(order, t);
      }

      await t.commit();
      
      await AuditService.log({
        userId: adminId,
        action: 'APPROVE_PAYMENT',
        entityType: 'PAYMENT',
        entityId: paymentId
      });

      return { success: true, message: 'Payment Approved', code: 100 };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  private static async activateOrder(order: Order, t: any) {
     await order.update({ status: 'PAID' }, { transaction: t });

      // @ts-ignore
      const items = order.items as any[];
      
      // Bulk Create Enrollments
      for (const item of items) {
        const level = await CourseLevel.findByPk(item.course_level_id);
        const days = level ? level.completion_window_days : 30;
        
        const startDate = new Date();
        const deadlineDate = new Date();
        deadlineDate.setDate(startDate.getDate() + days);

        await LevelEnrollment.create({
          worker_id: item.worker_id,
          course_level_id: item.course_level_id,
          start_date: startDate,
          deadline_date: deadlineDate,
          status: 'ACTIVE'
        }, { transaction: t });
      }
  }
}