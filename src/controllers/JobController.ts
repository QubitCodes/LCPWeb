import { Job, Course, JobSkill, Skill, Category, CourseLevel } from '../models';
import sequelize from '../lib/sequelize';
import { AuditService } from '../services/AuditService';

export class JobController {
  
  static async list() {
    const jobs = await Job.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: Course, as: 'course' },
        { model: Skill, as: 'skills', through: { attributes: ['difficulty_level'] } }
      ],
      order: [['created_at', 'DESC']]
    });
    return { success: true, data: jobs, code: 100 };
  }

  static async create(data: any, actorId: string, ip: string) {
    const t = await sequelize.transaction();

    try {
      // 1. Create Job
      const job = await Job.create({
        name: data.name,
        category_id: data.category_id
      }, { transaction: t });

      // 2. Create corresponding Course (1:1)
      const course = await Course.create({
        job_id: job.id,
        title: `${data.name} Certification`,
        description: data.description || `Certification course for ${data.name}`,
        is_active: true
      }, { transaction: t });

      // 3. Create 4 Course Levels (SRS Req)
      const levelsData = [
        { level_number: 1, fast_track: 0, title: 'Level 1: Foundation' },
        { level_number: 2, fast_track: 5, title: 'Level 2: Intermediate' }, // 5 years exp fast track
        { level_number: 3, fast_track: null, title: 'Level 3: Advanced' },
        { level_number: 4, fast_track: null, title: 'Level 4: Expert' },
      ];

      for (const lvl of levelsData) {
        await CourseLevel.create({
          course_id: course.id,
          level_number: lvl.level_number,
          title: lvl.title,
          description: `Standard content for ${lvl.title}`,
          fast_track_experience_required: lvl.fast_track as any,
          completion_window_days: 30 // Default
        }, { transaction: t });
      }

      // 4. Associate Skills
      if (data.skills && Array.isArray(data.skills)) {
        for (const s of data.skills) {
           await JobSkill.create({
             job_id: job.id,
             skill_id: s.skill_id,
             difficulty_level: s.level
           }, { transaction: t });
        }
      }

      await t.commit();

      // Log
      await AuditService.log({
        userId: actorId,
        action: 'CREATE_JOB',
        entityType: 'JOB',
        entityId: job.id,
        details: { name: job.name, category: data.category_id },
        ipAddress: ip
      });

      return { success: true, message: 'Job & Course created', data: job, code: 101 };

    } catch (error) {
      await t.rollback();
      console.error('Job Creation Error', error);
      throw error;
    }
  }
}