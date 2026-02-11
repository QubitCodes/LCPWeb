import { LevelRecommendation, User, Company, CourseLevel } from '../models';
import { AuditService } from '../services/AuditService';

export class RecommendationController {

  static async list(filters: any) {
    // Admins see all, Supervisors see their company's
    const where: any = {};
    if (filters.company_id) where.company_id = filters.company_id;
    if (filters.status) where.status = filters.status;

    const list = await LevelRecommendation.findAll({
      where,
      include: [
        { model: User, as: 'worker', attributes: ['first_name', 'last_name', 'email'] },
        { model: CourseLevel, as: 'level', attributes: ['title', 'level_number'] },
        { model: User, as: 'recommender', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    return { success: true, data: list, code: 100 };
  }

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

  static async updateStatus(id: string, status: 'APPROVED' | 'REJECTED', adminId: string, comment?: string) {
    const rec = await LevelRecommendation.findByPk(id);
    if (!rec) return { success: false, message: 'Not Found', code: 404 };

    await rec.update({
      status,
      admin_comment: comment,
      approved_by_admin_id: adminId
    });

    return { success: true, message: `Recommendation ${status}`, code: 100 };
  }
}