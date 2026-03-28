import { NextRequest } from 'next/server';
import { DashboardController } from '@/controllers/DashboardController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

/**
 * @swagger
 * /api/v1/page/dashboard:
 *   get:
 *     summary: Fetch Role-Based Dashboard Metrics
 *     description: Step 3. Returns a unified dashboard payload containing crucial metrics (Courses/Enrollments for Workers, Onboarding/Worker stats for Supervisors). Call this immediately after Login.
 *     tags: [Mobile - Dashboard]
 *     security:
 *       - bearerAuth: []
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
    }

    const result = await DashboardController.getDashboard(user);

    if (!result.success) {
      return sendResponse(400, {
        status: false,
        message: result.message || 'Failed to fetch dashboard',
        code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR
      });
    }

    return sendResponse(200, {
      status: true,
      message: result.message,
      code: RESPONSE_CODES.OK,
      data: 'data' in result ? result.data : null
    });

  } catch (error: any) {
    console.error('Unified Dashboard Error:', error);
    return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
  }
}
