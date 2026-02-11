import { NextRequest } from 'next/server';
import { AuthController } from '@/controllers/AuthController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { z } from 'zod';

const checkUserSchema = z.object({
    phone: z.string().min(3),
});

/**
 * @swagger
 * /api/v1/auth/check-user:
 *   post:
 *     description: Check if user exists by phone
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = checkUserSchema.safeParse(body);

        if (!validation.success) {
            return sendResponse(400, {
                status: false,
                message: 'Validation Error',
                code: RESPONSE_CODES.VALIDATION_ERROR,
                errors: validation.error.issues
            });
        }

        const { phone } = validation.data!;
        const result = await AuthController.checkUser(phone);

        if (!result.success) {
            return sendResponse(500, {
                status: false,
                message: result.message || 'Error checking user',
                code: result.code || RESPONSE_CODES.GENERAL_SERVER_ERROR
            });
        }

        return sendResponse(200, {
            status: true,
            message: 'Check successful',
            code: RESPONSE_CODES.OK,
            data: result.exists ? result.data : null,
            misc: { exists: result.exists }
        });

    } catch (error: any) {
        console.error('Check User API Error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal Server Error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR
        });
    }
}
