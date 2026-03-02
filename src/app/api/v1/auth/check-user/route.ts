import { NextRequest } from 'next/server';
import { AuthController } from '@/controllers/AuthController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { z } from 'zod';

const checkUserSchema = z.object({
    phone: z.string().min(3).optional(),
    email: z.string().email().optional(),
}).refine(data => data.phone || data.email, {
    message: 'At least one of phone or email is required',
});

/**
 * @swagger
 * /api/v1/auth/check-user:
 *   post:
 *     description: Check if user exists by phone number and/or email.
 *       Returns which fields are already taken.
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

        const { phone, email } = validation.data!;

        // Check phone if provided
        let phoneResult = null;
        if (phone) {
            phoneResult = await AuthController.checkUser(phone);
        }

        // Check email if provided
        let emailResult = null;
        if (email) {
            emailResult = await AuthController.checkUserByEmail(email);
        }

        // Build response
        const phoneExists = phoneResult?.exists || false;
        const emailExists = emailResult?.exists || false;

        return sendResponse(200, {
            status: true,
            message: 'Check successful',
            code: RESPONSE_CODES.OK,
            data: {
                phone_exists: phoneExists,
                email_exists: emailExists,
                phone_user: phoneExists ? phoneResult?.data : null,
                email_user: emailExists ? emailResult?.data : null,
            },
            misc: { exists: phoneExists || emailExists }
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

