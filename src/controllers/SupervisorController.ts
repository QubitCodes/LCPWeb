import { User, LevelEnrollment, CourseLevel, Course, ContentProgress, ContentItem } from '../models';
import { Op } from 'sequelize';

export class SupervisorController {
  
  static async getWorkerDetails(workerId: string, supervisorCompanyId: string) {
    // 1. Validate Worker belongs to Supervisor's Company
    const worker = await (User as any).findOne({
      where: { id: workerId, company_id: supervisorCompanyId, role: 'WORKER' },
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number', 'years_experience', 'created_at']
    });

    if (!worker) return { success: false, message: 'Worker not found or access denied', code: 404 };

    // 2. Get Enrollments with Progress Summary
    const enrollments = await (LevelEnrollment as any).findAll({
      where: { worker_id: workerId },
      include: [
        {
          model: CourseLevel,
          as: 'level',
          include: [{ model: Course, as: 'course', attributes: ['title'] }]
        },
        {
          model: ContentProgress,
          as: 'progress_records',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 3. Transform Data for Dashboard
    const enrollmentData = enrollments.map((e: any) => {
      // Calculate overall %
      const enrollmentAny = e as any;
      const records = enrollmentAny.progress_records || [];
      const totalItems = records.length; // Approximate, ideally count total items in level
      const completedItems = records.filter((r: any) => r.status === 'COMPLETED').length;
      
      return {
        id: e.id,
        course_title: enrollmentAny.level?.course?.title,
        level_title: enrollmentAny.level?.title,
        status: e.status,
        start_date: e.start_date,
        deadline_date: e.deadline_date,
        items_completed: completedItems,
        progress_records: records
      };
    });

    return {
      success: true,
      message: 'Worker details retrieved successfully',
      data: {
        worker,
        enrollments: enrollmentData
      },
      code: 100
    };
  }
}