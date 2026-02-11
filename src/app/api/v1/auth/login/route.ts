import { NextRequest } from 'next/server';
import { AuthController } from '@/controllers/AuthController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { z } from 'zod';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     description: Login user and return JWT
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return sendResponse(400, {
        status: false,
        message: 'Validation Error',
        code: RESPONSE_CODES.VALIDATION_ERROR,
        errors: validation.error.issues
      });
    }

    // Controller Call
    const result = await AuthController.login(validation.data);

    if (!result.success) {
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
    console.error('Login Error:', error);
    return sendResponse(500, {
      status: false,
      message: 'Internal Server Error',
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}