import { LevelRecommendation, User, Company, CourseLevel, Course } from '../models';
import { AuditService } from '../services/AuditService';
import { Op } from 'sequelize';

/**
 * RecommendationController
 * Handles level recommendation (approval) business logic.
 */
export class RecommendationController {

  /**
   * List recommendations with pagination and filters.
   * Admins see all; Supervisors see only their company's recommendations.
   * @param filters - Query filters (company_id, status, page, limit, search)
   */
  static async list(filters: any) {
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 10);
    const offset = (page - 1) * limit;

    const where: any = {};
    if (filters.company_id) where.company_id = filters.company_id;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.reason = { [Op.iLike]: `%${filters.search}%` };
    }

    const { count, rows } = await LevelRecommendation.findAndCountAll({
      where,
      include: [
        { model: User, as: 'worker', attributes: ['id', 'first_name', 'last_name', 'email'] },
        {
          model: CourseLevel, as: 'level',
          attributes: ['id', 'title', 'level_number'],
          include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }]
        },
        { model: User, as: 'recommender', attributes: ['id', 'first_name', 'last_name'] },
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: User, as: 'admin', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      success: true,
      data: rows,
      code: 100,
      misc: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Create a new recommendation (Supervisor action).
   * @param data - Recommendation data (worker_id, course_level_id, reason)
   * @param recommenderId - The supervisor creating the recommendation
   * @param companyId - The supervisor's company
   */
  static async create(data: any, recommenderId: string, companyId: string) {
    const rec = await LevelRecommendation.create({
      worker_id: data.worker_id,
      company_id: companyId,
      course_level_id: data.course_level_id,
      recommended_by_id: recommenderId,
      reason: data.reason,
      status: 'PENDING'
    });

    await AuditService.log({
      userId: recommenderId,
      action: 'CREATE_RECOMMENDATION',
      entityType: 'RECOMMENDATION',
      entityId: rec.id,
      details: { worker: data.worker_id, level: data.course_level_id }
    });

    return { success: true, data: rec, code: 101 };
  }

  /**
   * Update status of a recommendation (Admin approve/reject).
   * @param id - Recommendation UUID
   * @param status - New status (APPROVED or REJECTED)
   * @param adminId - The admin performing the action
   * @param comment - Optional admin comment
   */
  static async updateStatus(id: string, status: 'APPROVED' | 'REJECTED', adminId: string, comment?: string) {
    const rec = await LevelRecommendation.findByPk(id);
    if (!rec) return { success: false, message: 'Recommendation not found', code: 310 };

    await rec.update({
      status,
      admin_comment: comment,
      approved_by_admin_id: adminId
    });

    await AuditService.log({
      userId: adminId,
      action: `${status}_RECOMMENDATION`,
      entityType: 'RECOMMENDATION',
      entityId: id,
      details: { status, comment }
    });

    return { success: true, message: `Recommendation ${status.toLowerCase()}`, code: 103 };
  }
}