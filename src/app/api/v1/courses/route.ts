import { NextRequest } from 'next/server';
import { CourseController } from '@/controllers/CourseController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';

export const dynamic = 'force-dynamic';

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
