import { NextRequest } from 'next/server';
import { PaymentController } from '@/controllers/PaymentController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional()
});

/**
 * POST /api/v1/payments/[id]/approve
 * Approve or reject a pending manual payment.
 * Admin/Super Admin only.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: RESPONSE_CODES.PERMISSION_DENIED });
    }

    const body = await req.json();
    const validation = actionSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, {
        status: false,
        message: 'Invalid action. Expected approve or reject.',
        code: RESPONSE_CODES.VALIDATION_ERROR,
        errors: validation.error.issues
      });
    }

    let result;
    if (validation.data.action === 'approve') {
      result = await PaymentController.approve(id, user.id);
    } else {
      result = await PaymentController.reject(id, user.id, validation.data.reason);
    }

    if (!result.success) {
      return sendResponse(400, {
        status: false,
        message: result.message,
        code: result.code
      });
    }

    return sendResponse(200, {
      status: true,
      message: result.message,
      code: RESPONSE_CODES.UPDATED
    });

  } catch (error: any) {
    console.error('Payment Approve/Reject Error:', error);
    return sendResponse(500, {
      status: false,
      message: error.message,
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}