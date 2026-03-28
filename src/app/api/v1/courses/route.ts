import { NextRequest } from 'next/server';
import { CourseController } from '@/controllers/CourseController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const courseSchema = z.object({
  job_id: z.coerce.number().int().positive(),
  title: z.string().min(2),
  description: z.string().optional(),
  is_active: z.boolean().optional()
});

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     description: List all courses
 *     responses:
 *       200:
 *         description: Success
 */
export async function GET() {
  try {
    const result = await CourseController.list();
    return sendResponse(200, {
      status: true,
      message: 'Courses list',
      code: RESPONSE_CODES.OK,
      data: result.data
    });
  } catch (error) {
    console.error(error);
    return sendResponse(500, {
      status: false,
      message: 'Internal Server Error',
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}

/**
 * @swagger
 * /api/v1/courses:
 *   post:
 *     description: Create a standalone course mapped to a job. Enforces mapping restrictions if enabled in system settings.
 *     security:
 *       - bearerAuth: []
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
    }

    const body = await req.json();
    const validation = courseSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, {
        status: false,
        message: 'Validation Error',
        code: RESPONSE_CODES.VALIDATION_ERROR,
        errors: validation.error.issues
      });
    }

    const result = await CourseController.create(validation.data, user.id);
    
    if (!result.success) {
       return sendResponse(400, { status: false, message: result.message, code: result.code });
    }

    return sendResponse(201, {
      status: true,
      message: result.message,
      code: RESPONSE_CODES.CREATED,
      data: result.data
    });

  } catch (error: any) {
    console.error('Course Creation Error:', error);
    return sendResponse(500, {
      status: false,
      message: `Internal Server Error: ${error.message}`,
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}

/**
 * @swagger
 * /api/v1/courses:
 *   put:
 *     description: Update an existing course.
 *     security:
 *       - bearerAuth: []
 */
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
    }

    const body = await req.json();

    if (!body.id) {
       return sendResponse(400, { status: false, message: 'ID missing', code: RESPONSE_CODES.MISSING_REQUIRED_FIELD });
    }

    const result = await CourseController.update(body.id, body, user.id);
    
    if (!result.success) {
       return sendResponse(400, { status: false, message: result.message, code: result.code });
    }

    return sendResponse(200, {
      status: true,
      message: result.message,
      code: RESPONSE_CODES.OK,
      data: result.data
    });

  } catch (error: any) {
    console.error('Course Update Error:', error);
    return sendResponse(500, {
      status: false,
      message: `Internal Server Error: ${error.message}`,
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}
