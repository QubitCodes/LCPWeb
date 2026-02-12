import { NextRequest } from 'next/server';
import { QuizController } from '@/controllers/QuizController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const questionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['MCQ', 'TEXT']),
  points: z.number().min(1),
  options: z.array(z.object({
    text: z.string(),
    is_correct: z.boolean()
  })).min(2) // At least 2 options for MCQ
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await QuizController.getQuestions(id, true);
    return sendResponse(200, { status: true, message: 'Questions', code: 100, data: result.data });
  } catch (error: any) {
    console.error('GET /content/[id]/questions error:', error);
    return sendResponse(500, { status: false, message: error.message || 'Failed to fetch questions', code: 300 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    const body = await req.json();
    const validation = questionSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Validation', code: 201, errors: validation.error.issues });
    }

    const { id } = await params;
    const result = await QuizController.addQuestion(
      id,
      validation.data.text,
      validation.data.type,
      validation.data.points,
      validation.data.options
    );

    return sendResponse(201, { status: true, message: 'Question Added', code: 101, data: result.data });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}