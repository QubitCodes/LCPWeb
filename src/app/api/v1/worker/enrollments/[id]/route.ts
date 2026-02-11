import { NextRequest } from 'next/server';
import { ProgressionController } from '@/controllers/ProgressionController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: 210 });

    // Initialize logic ensures records exist and gets them sorted with status
    const progressTree = await ProgressionController.initializeOrGetProgress(id, user.id);

    return sendResponse(200, {
      status: true,
      message: 'Course Content',
      code: RESPONSE_CODES.OK,
      data: progressTree
    });

  } catch (error: any) {
    console.error(error);
    return sendResponse(500, { status: false, message: error.message || 'Server Error', code: 300 });
  }
}