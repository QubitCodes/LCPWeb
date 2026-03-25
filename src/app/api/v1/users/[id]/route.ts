import { NextRequest } from 'next/server';
import { UserController } from '@/controllers/UserController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
    }

    const result = await UserController.getById(id, user);

    if (!result.success) {
      return sendResponse(404, {
        status: false,
        message: result.message || 'User not found',
        code: 404
      });
    }

    return sendResponse(200, {
      status: true,
      message: 'User retrieved',
      code: RESPONSE_CODES.OK,
      data: result.data
    });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
    }

    if (user.role !== 'SUPER_ADMIN') {
        return sendResponse(403, { status: false, message: 'Forbidden', code: RESPONSE_CODES.AUTHORIZATION_ERROR });
    }

    const result = await UserController.delete(id, user);

    if (!result.success) {
      return sendResponse(400, {
        status: false,
        message: result.message || 'Failed to delete user',
        code: result.code || 400
      });
    }

    return sendResponse(200, {
      status: true,
      message: result.message,
      code: RESPONSE_CODES.OK,
      data: null
    });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}
