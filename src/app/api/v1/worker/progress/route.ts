import { NextRequest } from 'next/server';
import { ProgressionController } from '@/controllers/ProgressionController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const progressSchema = z.object({
  enrollment_id: z.string().uuid(),
  content_item_id: z.string().uuid(),
  watch_percentage: z.number().min(0).max(100).optional(),
  quiz_score: z.number().min(0).optional(),
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    option_id: z.string().uuid()
  })).optional()
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: 210 });

    const body = await req.json();
    const validation = progressSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Validation Error', code: 201 });
    }

    const result = await ProgressionController.updateProgress(
      validation.data.enrollment_id,
      validation.data.content_item_id,
      {
        watch_percentage: validation.data.watch_percentage,
        quiz_score: validation.data.quiz_score,
        answers: validation.data.answers
      }
    );

    return sendResponse(200, {
      status: result.success,
      message: result.message,
      code: result.code,
      data: {
        score: (result as any).score,
        course_status: (result as any).status
      }
    });

  } catch (error: any) {
    console.error(error);
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}