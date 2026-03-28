import { NextResponse } from 'next/server';
import { AuthController } from '../../../../../controllers/AuthController';
import { sendResponse, RESPONSE_CODES } from '../../../../../utils/responseHandler';

/**
 * @swagger
 * /api/v1/auth/register-supervisor:
 *   post:
 *     summary: Register Supervisor (Post-OTP)
 *     description: Register a brand new Supervisor profile after successfully verifying their phone number via Firebase.
 *     tags: [Mobile - Auth]
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate required fields
        if (!body.idToken || !body.first_name || !body.last_name || !body.phone) {
            return sendResponse(400, {
                status: false,
                message: 'Missing required fields: idToken, first_name, last_name, phone',
                code: RESPONSE_CODES.MISSING_REQUIRED_FIELD,
                data: null
            });
        }

        const result = await AuthController.registerSupervisor(body);

        if (result.success) {
            return sendResponse(201, {
                status: true,
                message: result.message,
                code: RESPONSE_CODES.CREATED,
                data: result.data
            });
        }

        return sendResponse(400, {
            status: false,
            message: result.message,
            code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
            data: null
        });

    } catch (error) {
        console.error('Register Supervisor Route Error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal server error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
            data: null
        });
    }
}
