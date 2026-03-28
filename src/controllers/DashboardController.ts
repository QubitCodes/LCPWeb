import { User, LevelEnrollment, CourseLevel, Course, ContentProgress, SurveyResponse, SurveyTemplate, Company, Certificate, LevelRecommendation } from '../models';

export class DashboardController {
  
  static async getDashboard(user: any) {
    try {
      if (user.role === 'SUPERVISOR' || user.role === 'ADMIN_SUPERVISOR') {
        const companyId = user.company_id;
        if (!companyId) return { success: false, message: 'No company assigned', code: 400 };
        return await this.getSupervisorDashboard(companyId);
      } else if (user.role === 'WORKER') {
        return await this.getWorkerDashboard(user.id);
      } else {
        return { success: false, message: 'Role not supported for dashboard', code: 403 };
      }
    } catch (error: any) {
      console.error('getDashboard Error:', error);
      return { success: false, message: 'Failed to retrieve dashboard data', code: 300 };
    }
  }

  private static async getSupervisorDashboard(companyId: string) {
    // 1. Get Company Name
    const company = await (Company as any).findByPk(companyId, { attributes: ['name'] });
    const companyName = company?.name || '';

    // 2. Worker count
    const workersCount = await (User as any).count({ 
      where: { company_id: companyId, role: 'WORKER', deleted_at: null } 
    });

    // 3. Certificates & Readiness
    // Fetch all worker IDs in company to query their enrollments
    const workers = await (User as any).findAll({
      where: { company_id: companyId, role: 'WORKER', deleted_at: null },
      attributes: ['id']
    });
    const workerIds = workers.map((w: any) => w.id);

    let certification_readiness = 0;
    let active_certs = 0;
    let in_progress = 0;

    if (workerIds.length > 0) {
      const enrollments = await (LevelEnrollment as any).findAll({
        where: { worker_id: workerIds, deleted_at: null }
      });
      
      const totalEnrollments = enrollments.length;
      active_certs = enrollments.filter((e: any) => e.status === 'COMPLETED').length;
      in_progress = enrollments.filter((e: any) => e.status === 'ACTIVE').length;

      if (totalEnrollments > 0) {
        certification_readiness = Math.round((active_certs / totalEnrollments) * 100);
      }
    }

    // 4. Pending Approvals
    let pendingRecs = 0;
    if (workerIds.length > 0) {
       pendingRecs = await (LevelRecommendation as any).count({ 
        where: { worker_id: workerIds, status: 'PENDING', deleted_at: null } 
      });
    }
    // Add pending onboarding surveys
    const pendingSurveys = await (SurveyResponse as any).count({
      where: { company_id: companyId, status: ['DRAFT', 'IN_PROGRESS'], deleted_at: null },
      include: [{ model: SurveyTemplate, as: 'template', where: { type: 'ONBOARDING', deleted_at: null } }]
    });
    const pending_approvals = pendingRecs + pendingSurveys;

    // 5. Recent Activity
    // Approximate this by fetching the 5 most recently updated Enrollments
    let recentEnrollments: any[] = [];
    if (workerIds.length > 0) {
      recentEnrollments = await (LevelEnrollment as any).findAll({
        where: { worker_id: workerIds, deleted_at: null },
        include: [
          { model: User, as: 'worker', attributes: ['first_name', 'last_name'] },
          { model: CourseLevel, as: 'level', include: [{ model: Course, as: 'course', attributes: ['title'] }] }
        ],
        order: [['updated_at', 'DESC']],
        limit: 5
      });
    }

    const recent_activity = recentEnrollments.map((e: any) => {
      const userName = `${e.worker?.first_name || ''} ${e.worker?.last_name || ''}`.trim();
      const courseTitle = e.level?.course?.title || e.level?.title || 'Unknown Course';
      
      let action = '';
      let displayStatus = '';
      if (e.status === 'COMPLETED') {
        action = `Completed ${courseTitle}`;
        displayStatus = 'DONE';
      } else {
        action = `Started ${courseTitle}`;
        displayStatus = 'IN PROGRESS'; 
      }

      return {
        user: userName,
        action: action,
        status: displayStatus,
        time_ago: e.updated_at // Pass UTC date back, UI handles relative formatting
      };
    });

    return {
      success: true,
      message: 'Supervisor dashboard retrieved',
      code: 100,
      data: {
        role: 'SUPERVISOR',
        company_name: companyName,
        metrics: {
          certification_readiness: certification_readiness,
          total_workers: workersCount,
          active_certs: active_certs,
          pending_approvals: pending_approvals,
          in_progress: in_progress
        },
        recent_activity: recent_activity
      }
    };
  }

  private static async getWorkerDashboard(workerId: string) {
    const worker = await (User as any).findByPk(workerId, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number'],
    });

    if (!worker) {
       return { success: false, message: 'Worker not found', code: 404 };
    }

    // Get enrollments
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

    const metrics = {
      total_assigned: enrollments.length,
      completed: enrollments.filter((e: any) => e.status === 'COMPLETED').length,
      in_progress: enrollments.filter((e: any) => e.status === 'ACTIVE').length,
    };

    const enrollmentData = enrollments.map((e: any) => {
      const records = e.progress_records || [];
      const completedItems = records.filter((r: any) => r.status === 'COMPLETED').length;
      
      return {
        id: e.id,
        course_title: e.level?.course?.title,
        level_title: e.level?.title,
        status: e.status,
        start_date: e.start_date,
        deadline_date: e.deadline_date,
        items_completed: completedItems,
        progress_records: records
      };
    });

    return {
      success: true,
      message: 'Worker dashboard retrieved',
      code: 100,
      data: {
        role: 'WORKER',
        worker,
        metrics,
        enrollments: enrollmentData
      }
    };
  }
}
