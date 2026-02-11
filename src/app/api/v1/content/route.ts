import { NextRequest } from 'next/server';
import { CourseController } from '@/controllers/CourseController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const contentSchema = z.object({
  course_level_id: z.string().uuid(),
  title: z.string().min(2),
  type: z.enum(['VIDEO', 'QUESTIONNAIRE']),
  video_url: z.string().optional(),
  video_duration_seconds: z.number().optional(),
  is_eligibility_check: z.boolean().optional(),
  is_final_exam: z.boolean().optional(),
  passing_score: z.number().optional()
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: 210 });

    const body = await req.json();
    const validation = contentSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Validation', code: 201, errors: validation.error.issues });
    }

    const result = await CourseController.addContent(validation.data, user.id);
    return sendResponse(201, { status: true, message: 'Content Added', code: 101, data: result.data });

  } catch (error) {
    return sendResponse(500, { status: false, message: 'Server Error', code: 300 });
  }
}