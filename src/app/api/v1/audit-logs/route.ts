import { NextRequest } from 'next/server';
import { AuditController } from '@/controllers/AuditController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    // Only Super Admin should ideally see this, but Admin allowed for now
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    const result = await AuditController.list(user);
    return sendResponse(200, {
      status: true,
      message: 'Audit Logs',
      code: RESPONSE_CODES.OK,
      data: result.data
    });
  } catch (error) {
    return sendResponse(500, { status: false, message: 'Server Error', code: 300 });
  }
}