import { NextRequest } from 'next/server';
import { ReferenceController } from '@/controllers/ReferenceController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET handler for reference data
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;
    const result = await ReferenceController.list(type);

    return sendResponse(result.success ? 200 : 400, {
      status: result.success,
      message: result.message || 'Data retrieved',
      code: result.success ? RESPONSE_CODES.OK : result.code as any,
      data: result.data
    });
  } catch (error) {
    console.error('Reference API Error:', error);
    return sendResponse(500, {
      status: false,
      message: 'Internal error',
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}

/**
 * POST handler for reference data
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, {
        status: false,
        message: 'Forbidden',
        code: RESPONSE_CODES.AUTHORIZATION_ERROR
      });
    }

    const body = await req.json();
    const result = await ReferenceController.create(type, body, user.id, '0.0.0.0');

    return sendResponse(result.success ? 201 : 400, {
      status: result.success,
      message: result.message,
      code: result.success ? RESPONSE_CODES.CREATED : result.code as any,
      data: result.data
    });
  } catch (error) {
    return sendResponse(500, { status: false, message: 'Internal error', code: 300 });
  }
}

/**
 * PATCH handler for reference data
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return sendResponse(400, { status: false, message: 'Missing ID', code: RESPONSE_CODES.MISSING_REQUIRED_FIELD });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: RESPONSE_CODES.AUTHORIZATION_ERROR });
    }

    const body = await req.json();
    const result = await ReferenceController.update(type, id, body, user.id, '0.0.0.0');

    return sendResponse(result.success ? 200 : 400, {
      status: result.success,
      message: result.message,
      code: result.success ? RESPONSE_CODES.UPDATED : result.code as any,
      data: result.data
    });
  } catch (error) {
    return sendResponse(500, { status: false, message: 'Internal error', code: 300 });
  }
}

/**
 * DELETE handler for reference data
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params;
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return sendResponse(400, { status: false, message: 'Missing ID', code: RESPONSE_CODES.MISSING_REQUIRED_FIELD });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: RESPONSE_CODES.AUTHORIZATION_ERROR });
    }

    const result = await ReferenceController.delete(type, id, user.id, '0.0.0.0');

    return sendResponse(result.success ? 200 : 400, {
      status: result.success,
      message: result.message,
      code: result.success ? RESPONSE_CODES.UPDATED : result.code as any
    });
  } catch (error) {
    return sendResponse(500, { status: false, message: 'Internal error', code: 300 });
  }
}
