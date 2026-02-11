import { NextRequest } from 'next/server';
import { OrderController } from '@/controllers/OrderController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    const result = await OrderController.approveManualPayment(id, user.id);

    return sendResponse(200, { status: true, message: result.message, code: 100 });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}