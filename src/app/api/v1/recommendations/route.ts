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

/**
 * GET /api/v1/recommendations
 * List recommendations with pagination and filters.
 * Supervisors see own company; Admins see all.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');
    if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHENTICATION_ERROR });

    const url = new URL(req.url);
    const filters: any = {
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '10',
      status: url.searchParams.get('status') || '',
      search: url.searchParams.get('search') || ''
    };

    // Supervisors see only their company
    if (user.role === 'SUPERVISOR') {
      filters.company_id = user.company_id;
    }

    const result = await RecommendationController.list(filters);

    return sendResponse(200, {
      status: true,
      message: 'Recommendations',
      code: RESPONSE_CODES.OK,
      data: result.data,
      misc: result.misc
    });

  } catch (error: any) {
    console.error('Recommendations API Error:', error);
    return sendResponse(500, { status: false, message: error.message, code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
  }
}

/**
 * POST /api/v1/recommendations
 * Create a new recommendation (Supervisor only).
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || user.role !== 'SUPERVISOR') {
      return sendResponse(403, { status: false, message: 'Only Supervisors can create recommendations', code: RESPONSE_CODES.PERMISSION_DENIED });
    }

    const body = await req.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, {
        status: false,
        message: 'Validation Error',
        code: RESPONSE_CODES.VALIDATION_ERROR,
        errors: validation.error.issues
      });
    }

    const result = await RecommendationController.create(validation.data, user.id, user.company_id);
    return sendResponse(201, {
      status: true,
      message: 'Recommendation created',
      code: RESPONSE_CODES.CREATED,
      data: result.data
    });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
  }
}