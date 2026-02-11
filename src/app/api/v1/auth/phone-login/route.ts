import { NextRequest } from 'next/server';
import { AuthController } from '@/controllers/AuthController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { z } from 'zod';
import { cookies } from 'next/headers';

const phoneLoginSchema = z.object({
    idToken: z.string(),
});

/**
 * @swagger
 * /api/v1/auth/phone-login:
 *   post:
 *     description: Login user with Firebase Phone Auth ID Token
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation
        const validation = phoneLoginSchema.safeParse(body);
        if (!validation.success) {
            return sendResponse(400, {
                status: false,
                message: 'Validation Error',
                code: RESPONSE_CODES.VALIDATION_ERROR,
                errors: validation.error.issues
            });
        }

        // Controller Call
        const result = await AuthController.loginWithPhone(validation.data.idToken);

        if (!result.success) {
            // Special case for New User -> Return 200 with flag so frontend knows to show registration
            if (result.is_new_user) {
                return sendResponse(200, {
                    status: false, // It's not a success login yet
                    message: result.message,
                    code: result.code,
                    data: { is_new_user: true, phone_number: result.phone_number }
                });
            }

            return sendResponse(401, {
                status: false,
                message: result.message,
                code: result.code || RESPONSE_CODES.AUTHENTICATION_ERROR
            });
        }

        // Set HttpOnly Cookie
        if (result.data) {
            (await cookies()).set('auth_token', result.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });
        }

        return sendResponse(200, {
            status: true,
            message: result.message,
            code: RESPONSE_CODES.OK,
            data: result.data
        });

    } catch (error: any) {
        console.error('Phone Login Error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal Server Error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR
        });
    }
}
