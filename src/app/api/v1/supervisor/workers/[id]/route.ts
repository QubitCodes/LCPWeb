import { NextRequest } from 'next/server';
import { SupervisorController } from '@/controllers/SupervisorController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || user.role !== 'SUPERVISOR') {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    const result = await SupervisorController.getWorkerDetails(id, user.company_id);

    if (!result.success) {
      // TypeScript requires message to be a string, fallback ensures it is never undefined
      return sendResponse(404, {
        status: false,
        message: result.message || 'Worker not found',
        code: 404
      });
    }

    return sendResponse(200, {
      status: true,
      message: 'Worker Details',
      code: RESPONSE_CODES.OK,
      data: result.data
    });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}