import { Company, User, LevelEnrollment, Order, LevelRecommendation } from '../models';

export class StatsController {

  static async getAdminStats() {
    const [companies, workers, activeEnrollments, completedEnrollments] = await Promise.all([
      Company.count(),
      User.count({ where: { role: 'WORKER' } }),
      LevelEnrollment.count({ where: { status: 'ACTIVE' } }),
      LevelEnrollment.count({ where: { status: 'COMPLETED' } })
    ]);

    const pendingRecs = await LevelRecommendation.count({ where: { status: 'PENDING' } });

    return {
      success: true,
      data: {
        companies,
        workers,
        activeEnrollments,
        completedEnrollments,
        pendingRecs
      },
      code: 100
    };
  }

  static async getSupervisorStats(companyId: string) {
    const workers = await User.count({ where: { company_id: companyId, role: 'WORKER' } });
    
    // Enrollments for company workers
    // This is a simplified count, ideally we join tables but for MVP we fetch workers first or use associations in count
    // Doing a raw count logic roughly for now:
    // Actually, LevelEnrollment has no direct company_id, so we rely on worker association.
    // For performance, we can skip complex count if not needed or assume `Order` tracks company.
    
    // Let's count pending recommendations for this company
    const pendingRecs = await LevelRecommendation.count({ where: { company_id: companyId, status: 'PENDING' } });
    const approvedRecs = await LevelRecommendation.count({ where: { company_id: companyId, status: 'APPROVED' } });

    return {
      success: true,
      data: {
        workers,
        pendingRecs,
        approvedRecs
      },
      code: 100
    };
  }
}