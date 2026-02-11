import { Question, QuestionOption, ContentItem } from '../models';
import sequelize from '../lib/sequelize';

interface OptionData {
  text: string;
  is_correct: boolean;
}

export class QuizController {
  
  static async getQuestions(contentItemId: string, includeAnswers: boolean = false) {
    const questions = await Question.findAll({
      where: { content_item_id: contentItemId },
      include: [
        { 
          model: QuestionOption, 
          as: 'options',
          attributes: includeAnswers ? undefined : { exclude: ['is_correct'] } // Hide answers for workers if needed
        }
      ],
      order: [
        ['sequence_order', 'ASC'],
        [{ model: QuestionOption, as: 'options' }, 'order', 'ASC']
      ]
    });
    return { success: true, data: questions, code: 100 };
  }

  static async addQuestion(
    contentItemId: string, 
    text: string, 
    type: 'MCQ' | 'TEXT', 
    points: number, 
    options: OptionData[]
  ) {
    const t = await sequelize.transaction();

    try {
      // 1. Verify Content Type
      const content = await ContentItem.findByPk(contentItemId);
      if (!content || content.type !== 'QUESTIONNAIRE') {
        throw new Error('Invalid content item type');
      }

      // 2. Create Question
      // Auto-sequence: find max order
      const lastQ = await Question.findOne({
        where: { content_item_id: contentItemId },
        order: [['sequence_order', 'DESC']]
      });
      const seq = lastQ ? lastQ.sequence_order + 1 : 1;

      const question = await Question.create({
        content_item_id: contentItemId,
        text,
        type,
        points,
        sequence_order: seq
      }, { transaction: t });

      // 3. Create Options
      if (options && options.length > 0) {
        let optSeq = 1;
        for (const opt of options) {
          await QuestionOption.create({
            question_id: question.id,
            text: opt.text,
            is_correct: opt.is_correct,
            order: optSeq++
          }, { transaction: t });
        }
      }

      await t.commit();
      return { success: true, data: question, code: 101 };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}