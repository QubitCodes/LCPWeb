import { NextRequest } from 'next/server';
import { CourseController } from '@/controllers/CourseController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await CourseController.getDetails(id);

    if (!result.success) {
      return sendResponse(404, {
        status: false,
        message: result.message || 'Not found',
        code: RESPONSE_CODES.RESOURCE_NOT_FOUND
      });
    }

    return sendResponse(200, {
      status: true,
      message: 'Course details',
      code: RESPONSE_CODES.OK,
      data: result.data
    });
  } catch (error) {
    return sendResponse(500, {
      status: false,
      message: 'Internal Error',
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}