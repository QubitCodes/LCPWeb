import { Course, CourseLevel, ContentItem, Job } from '../models';
import { AuditService } from '../services/AuditService';

export class CourseController {
  
  static async getDetails(courseId: string) {
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: CourseLevel,
          as: 'levels',
          include: [
            {
              model: ContentItem,
              as: 'contents',
              // Order content by sequence
            }
          ]
        }
      ],
      order: [
        [{ model: CourseLevel, as: 'levels' }, 'level_number', 'ASC'],
        [{ model: CourseLevel, as: 'levels' }, { model: ContentItem, as: 'contents' }, 'sequence_order', 'ASC']
      ]
    });

    if (!course) return { success: false, message: 'Course not found', code: 404 };

    return { success: true, data: course, code: 100 };
  }

  static async addContent(data: any, actorId: string) {
    // Determine sequence order if not provided
    let sequence = data.sequence_order;
    if (!sequence) {
      const lastItem = await ContentItem.findOne({
        where: { course_level_id: data.course_level_id },
        order: [['sequence_order', 'DESC']]
      });
      sequence = lastItem ? lastItem.sequence_order + 1 : 1;
    }

    const content = await ContentItem.create({
      course_level_id: data.course_level_id,
      title: data.title,
      type: data.type,
      sequence_order: sequence,
      video_url: data.video_url,
      video_duration_seconds: data.video_duration_seconds,
      min_watch_percentage: data.min_watch_percentage || 90,
      is_eligibility_check: data.is_eligibility_check || false,
      is_final_exam: data.is_final_exam || false,
      passing_score: data.passing_score,
      retry_threshold: data.retry_threshold,
      max_attempts_allowed: data.max_attempts_allowed
    });

    await AuditService.log({
      userId: actorId,
      action: 'ADD_CONTENT',
      entityType: 'CONTENT_ITEM',
      entityId: content.id,
      details: { title: content.title, type: content.type }
    });

    return { success: true, data: content, code: 101 };
  }

  static async list() {
    const courses = await Course.findAll({
      include: [
        {
          model: (await import('../models')).Job, // Dynamic import to avoid circular dependency if any, or just import at top if safe. Let's use standard import at top if possible, but for now I'll add Job to top imports.
          as: 'job',
          attributes: ['id', 'name']
        },
        {
          model: CourseLevel,
          as: 'levels',
          attributes: ['id']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return { success: true, data: courses, code: 100 };
  }
}