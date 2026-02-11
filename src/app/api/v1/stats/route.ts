import { NextRequest } from 'next/server';
import { StatsController } from '@/controllers/StatsController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: 210 });

    let result;
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      result = await StatsController.getAdminStats();
    } else if (user.role === 'SUPERVISOR') {
      result = await StatsController.getSupervisorStats(user.company_id);
    } else {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    return sendResponse(200, {
      status: true,
      message: 'Stats retrieved',
      code: RESPONSE_CODES.OK,
      data: result.data
    });

  } catch (error) {
    return sendResponse(500, { status: false, message: 'Server Error', code: 300 });
  }
}