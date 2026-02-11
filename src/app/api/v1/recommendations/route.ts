import { NextRequest } from 'next/server';
import { RecommendationController } from '@/controllers/RecommendationController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  worker_id: z.string().uuid(),
  course_level_id: z.string().uuid(),
  reason: z.string().min(5)
});

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = await verifyToken(token || '');
  if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: 210 });

  const filters: any = {};
  if (user.role === 'SUPERVISOR') filters.company_id = user.company_id;
  // Admin sees all

  const result = await RecommendationController.list(filters);
  return sendResponse(200, { status: true, message: 'List', code: 100, data: result.data });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || user.role !== 'SUPERVISOR') {
      return sendResponse(403, { status: false, message: 'Only Supervisors', code: 211 });
    }

    const body = await req.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Validation', code: 201 });
    }

    const result = await RecommendationController.create(validation.data, user.id, user.company_id);
    return sendResponse(201, { status: true, message: 'Recommendation Sent', code: 101, data: result.data });

  } catch (error) {
    return sendResponse(500, { status: false, message: 'Error', code: 300 });
  }
}