import { NextRequest } from 'next/server';
import { RecommendationController } from '@/controllers/RecommendationController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional()
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Only Admin', code: 211 });
    }

    const body = await req.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Validation', code: 201 });
    }

    const result = await RecommendationController.updateStatus(
      id,
      validation.data.status,
      user.id,
      validation.data.comment
    );

    return sendResponse(200, { status: true, message: result.message, code: 100 });

  } catch (error) {
    return sendResponse(500, { status: false, message: 'Error', code: 300 });
  }
}