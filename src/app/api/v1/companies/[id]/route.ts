import { NextRequest } from 'next/server';
import { CompanyController } from '@/controllers/CompanyController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { Api } from '@/lib/QubitRequest';

export const dynamic = 'force-dynamic';

// Standard Next.js route handler to bypass Api wrapper's context bug
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const result = await CompanyController.getById(id);
        return sendResponse(200, result);
    } catch (error: any) {
        return sendResponse(500, {
            status: false,
            message: 'Server Error: ' + error.message,
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
        });
    }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        // 1. Auth Check
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        const user = await verifyToken(token || '');

        if (!user) {
            return sendResponse(401, {
                status: false,
                message: 'Unauthorized',
                code: RESPONSE_CODES.AUTHENTICATION_ERROR
            });
        }

        const params = await context.params;
        const id = params.id;

        // 2. Parse payload
        const rawData = await req.json();

        // 3. Update Check
        const result = await CompanyController.update(id, rawData, user.id);

        if (!result.status) {
            return sendResponse(400, result);
        }

        return sendResponse(200, result);
    } catch (error: any) {
        return sendResponse(500, {
            status: false,
            message: 'Server Error: ' + error.message,
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
        });
    }
}
