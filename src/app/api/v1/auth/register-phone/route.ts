import { NextRequest } from 'next/server';
import { AuthController } from '@/controllers/AuthController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { UserRole } from '@/models/enums';

const registerPhoneSchema = z.object({
    idToken: z.string(),
    email: z.string().email(),
    first_name: z.string().min(2),
    last_name: z.string().min(2),
    country_code: z.string().startsWith('+'),
    phone: z.string().min(5),
    role: z.nativeEnum(UserRole),
    company_id: z.string().optional(),
    company_name: z.string().optional(), // For Supervisors creating a company
});

/**
 * @swagger
 * /api/v1/auth/register-phone:
 *   post:
 *     description: Register new user verified via Phone Auth
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation
        const validation = registerPhoneSchema.safeParse(body);
        if (!validation.success) {
            return sendResponse(400, {
                status: false,
                message: 'Validation Error',
                code: RESPONSE_CODES.VALIDATION_ERROR,
                errors: validation.error.issues
            });
        }

        // Controller Call
        const result = await AuthController.registerPhoneUser(validation.data);

        if (!result.success) {
            return sendResponse(400, {
                status: false,
                message: result.message,
                code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR
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
            code: RESPONSE_CODES.CREATED,
            data: result.data
        });

    } catch (error: any) {
        console.error('Phone Registration Error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal Server Error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR
        });
    }
}
