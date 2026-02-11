import { LevelEnrollment, ContentItem, ContentProgress, CourseLevel, User, Question, QuestionOption, Certificate } from '../models';
import sequelize from '../lib/sequelize';
import { Op } from 'sequelize';
import { ProgressStatus } from '../models/ContentProgress';
import { ContentType } from '../models/ContentItem';
import { v4 as uuidv4 } from 'uuid';

export class ProgressionController {

  static async initializeOrGetProgress(enrollmentId: string, workerId: string) {
    const enrollment = await (LevelEnrollment as any).findByPk(enrollmentId, {
      include: [
        {
          model: CourseLevel,
          as: 'level',
          include: [{ model: ContentItem, as: 'contents' }]
        }
      ]
    });

    if (!enrollment) throw new Error('Enrollment not found');

    // Check Expiry on Load
    if (new Date() > new Date(enrollment.deadline_date) && enrollment.status === 'ACTIVE') {
        await enrollment.update({ status: 'EXPIRED' });
    }

    // @ts-ignore
    const contents: ContentItem[] = enrollment.level.contents.sort((a, b) => a.sequence_order - b.sequence_order);

    if (contents.length === 0) return [];

    const progressRecords = [];

    for (let i = 0; i < contents.length; i++) {
      const item = contents[i];
      const [record, created] = await (ContentProgress as any).findOrCreate({
        where: {
          enrollment_id: enrollmentId,
          content_item_id: item.id
        },
        defaults: {
          enrollment_id: enrollmentId,
          content_item_id: item.id,
          worker_id: workerId,
          status: i === 0 ? ProgressStatus.UNLOCKED : ProgressStatus.LOCKED,
          watch_percentage: 0,
          attempts_count: 0
        }
      });
      
      const plainRecord = record.toJSON();
      (plainRecord as any).content = item;
      progressRecords.push(plainRecord);
    }

    return progressRecords.sort((a: any, b: any) => a.content.sequence_order - b.content.sequence_order);
  }

  static async updateProgress(
    enrollmentId: string, 
    contentId: string, 
    data: { 
      watch_percentage?: number; 
      quiz_score?: number; 
      answers?: { question_id: string, option_id: string }[] 
    }
  ) {
    const t = await sequelize.transaction();

    try {
      // 1. Expiry Check
      const enrollment = await (LevelEnrollment as any).findByPk(enrollmentId, { transaction: t });
      if (!enrollment) throw new Error('Enrollment not found');

      if (new Date() > new Date(enrollment.deadline_date) || enrollment.status === 'EXPIRED') {
         if(enrollment.status !== 'EXPIRED') await enrollment.update({ status: 'EXPIRED' }, { transaction: t });
         await t.commit();
         return { success: false, message: 'Course has expired. Please re-enroll.', code: 403, status: 'EXPIRED' };
      }

      const progress = await (ContentProgress as any).findOne({
        where: { enrollment_id: enrollmentId, content_item_id: contentId },
        include: [{ model: ContentItem, as: 'content_item' }],
        transaction: t
      });

      if (!progress) throw new Error('Progress record not found');
      if (progress.status === ProgressStatus.LOCKED) throw new Error('Content is locked');

      // @ts-ignore
      const contentItem: ContentItem = progress.content_item;
      let isPassed = false;
      let calculatedScore = data.quiz_score || 0;

      // --- VIDEO LOGIC ---
      if (contentItem.type === ContentType.VIDEO && data.watch_percentage !== undefined) {
        await progress.update({ 
          watch_percentage: Math.max(progress.watch_percentage, data.watch_percentage),
          last_accessed_at: new Date()
        }, { transaction: t });

        if (progress.watch_percentage >= contentItem.min_watch_percentage) {
          await progress.update({ status: ProgressStatus.COMPLETED }, { transaction: t });
          isPassed = true;
        } else {
          await progress.update({ status: ProgressStatus.IN_PROGRESS }, { transaction: t });
        }
      }

      // --- QUIZ LOGIC ---
      if (contentItem.type === ContentType.QUESTIONNAIRE) {
        
        // If answers provided, calculate score
        if (data.answers && data.answers.length > 0) {
          let totalPoints = 0;
          let earnedPoints = 0;

          const questions = await (Question as any).findAll({
            where: { content_item_id: contentId },
            include: [{ model: QuestionOption, as: 'options' }],
            transaction: t
          });

          for (const q of questions) {
            totalPoints += q.points;
            const userAnswer = data.answers.find(a => a.question_id === q.id);
            if (userAnswer) {
              // @ts-ignore
              const correctOption = q.options.find((o: any) => o.is_correct);
              if (correctOption && correctOption.id === userAnswer.option_id) {
                earnedPoints += q.points;
              }
            }
          }
          calculatedScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        }

        const attempts = progress.attempts_count + 1;
        // @ts-ignore
        const passingScore = contentItem.passing_score || 70;
        const passed = calculatedScore >= passingScore;

        await progress.update({
          quiz_score: Math.round(calculatedScore),
          attempts_count: attempts,
          last_accessed_at: new Date()
        }, { transaction: t });

        if (passed) {
          await progress.update({ status: ProgressStatus.COMPLETED }, { transaction: t });
          isPassed = true;
        } else {
          await progress.update({ status: ProgressStatus.FAILED }, { transaction: t });

          // Hard Fail Logic (Watch previous video)
          if (contentItem.retry_threshold && calculatedScore < contentItem.retry_threshold) {
             await progress.update({ status: ProgressStatus.LOCKED }, { transaction: t });
             
             const prevContent = await (ContentItem as any).findOne({
               where: {
                 course_level_id: contentItem.course_level_id,
                 sequence_order: { [Op.lt]: contentItem.sequence_order },
                 type: ContentType.VIDEO
               },
               order: [['sequence_order', 'DESC']],
               transaction: t
             });

             if (prevContent) {
               await (ContentProgress as any).update(
                 { status: ProgressStatus.UNLOCKED, watch_percentage: 0 },
                 { where: { enrollment_id: enrollmentId, content_item_id: prevContent.id }, transaction: t }
               );
             }
             
             await t.commit();
             return { success: false, message: 'Failed: You must re-watch the previous video.', code: 200, score: calculatedScore };
          }

          if (contentItem.is_final_exam && attempts >= (contentItem.max_attempts_allowed || 3)) {
            await (LevelEnrollment as any).update(
              { status: 'FAILED' },
              { where: { id: enrollmentId }, transaction: t }
            );
            await t.commit();
            return { success: false, message: 'Course Failed: Max attempts exceeded.', code: 200, status: 'COURSE_FAILED', score: calculatedScore };
          }
        }
      }

      // --- UNLOCK NEXT or COMPLETE LEVEL ---
      if (isPassed) {
        const nextItem = await (ContentItem as any).findOne({
          where: {
            course_level_id: contentItem.course_level_id,
            sequence_order: { [Op.gt]: contentItem.sequence_order }
          },
          order: [['sequence_order', 'ASC']],
          transaction: t
        });

        if (nextItem) {
          await (ContentProgress as any).update(
            { status: ProgressStatus.UNLOCKED },
            { 
              where: { enrollment_id: enrollmentId, content_item_id: nextItem.id },
              transaction: t
            }
          );
        } else {
          await (LevelEnrollment as any).update(
            { status: 'COMPLETED', completion_date: new Date() },
            { where: { id: enrollmentId }, transaction: t }
          );

          // Generate Certificate
          const uniqueCode = `CERT-${Date.now()}-${uuidv4().substring(0, 4)}`.toUpperCase();
          await (Certificate as any).create({
            worker_id: progress.worker_id,
            enrollment_id: enrollmentId,
            course_level_id: contentItem.course_level_id,
            certificate_code: uniqueCode,
            issue_date: new Date()
          }, { transaction: t });
        }
      }

      await t.commit();
      return { success: true, message: 'Progress updated', code: 100, score: calculatedScore };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}