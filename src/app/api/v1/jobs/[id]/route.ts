import { NextRequest } from 'next/server';
import { JobController } from '@/controllers/JobController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   get:
 *     description: Get single job details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
export async function GET(
  req: NextRequest,
  props: any
) {
  try {
    const params = await props.params;
    const id = params.id as string;
    if (!id) {
       return sendResponse(400, { status: false, message: 'ID missing', code: RESPONSE_CODES.MISSING_REQUIRED_FIELD });
    }

    const jobId = String(id);
    const result = await JobController.getDetails(jobId);
    
    if (!result.success) {
       return sendResponse(404, { status: false, message: result.message || 'Job not found', code: result.code || RESPONSE_CODES.RESOURCE_NOT_FOUND });
    }

    return sendResponse(200, {
      status: true,
      message: 'Job details',
      code: RESPONSE_CODES.OK,
      data: result.data
    });
  } catch (error: any) {
    console.error(error);
    return sendResponse(500, {
      status: false,
      message: `Internal Server Error: ${error.message}`,
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}
