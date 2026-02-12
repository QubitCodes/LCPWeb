import { NextRequest } from 'next/server';
import { PaymentController } from '@/controllers/PaymentController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/payments
 * List all payments with pagination and filters.
 * Admin/Super Admin only.
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        const user = await verifyToken(token || '');

        if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return sendResponse(403, { status: false, message: 'Forbidden', code: RESPONSE_CODES.PERMISSION_DENIED });
        }

        const url = new URL(req.url);
        const filters = {
            page: url.searchParams.get('page') || '1',
            limit: url.searchParams.get('limit') || '10',
            status: url.searchParams.get('status') || '',
            provider: url.searchParams.get('provider') || '',
            search: url.searchParams.get('search') || ''
        };

        const result = await PaymentController.list(filters, user);

        return sendResponse(200, {
            status: true,
            message: 'Payments retrieved',
            code: RESPONSE_CODES.OK,
            data: result.data,
            misc: result.misc
        });

    } catch (error: any) {
        console.error('Payments API Error:', error);
        return sendResponse(500, {
            status: false,
            message: `Internal Server Error: ${error.message}`,
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR
        });
    }
}
