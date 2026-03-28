import { NextRequest } from 'next/server';
import { AuthController } from '@/controllers/AuthController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { z } from 'zod';
import { UserRole } from '@/models/enums';

const registerPhoneSchema = z.object({
    idToken: z.string(),
    first_name: z.string().min(2),
    last_name: z.string().min(2),
    country_code: z.string().startsWith('+'),
    phone: z.string().min(5),
    email: z.string().email().optional().or(z.literal('')), // Optional email
    role: z.nativeEnum(UserRole),
    company_id: z.string().min(1), // 6-digit company code
});

/**
 * @swagger
 * /api/v1/auth/register-phone:
 *   post:
 *     summary: Register Worker (Post-OTP)
 *     description: Register a brand new worker profile after successfully verifying their phone number via Firebase. The user remains in a pending status until approved by a Supervisor or Admin.
 *     tags: [Mobile - Auth]
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

        // No cookie setting — user is pending approval, cannot login yet
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
