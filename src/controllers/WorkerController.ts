import { User, LevelEnrollment, CourseLevel, Course, ContentProgress } from '../models';

export class WorkerController {
  
  static async getWorkerDashboard(workerId: string) {
    try {
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
          worker,
          metrics,
          enrollments: enrollmentData
        }
      };
    } catch (error: any) {
      console.error('getWorkerDashboard Error:', error);
      return { success: false, message: 'Failed to retrieve dashboard data', code: 300 };
    }
  }
}
