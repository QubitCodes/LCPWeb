import { NextRequest } from 'next/server';
import { JobController } from '@/controllers/JobController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const jobSchema = z.object({
  name: z.string().min(2),
  category_id: z.string().uuid(),
  description: z.string().optional(),
  skills: z.array(z.object({
    skill_id: z.string().uuid(),
    level: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED'])
  })).optional()
});

export async function GET() {
  const result = await JobController.list();
  return sendResponse(200, {
    status: true,
    message: 'Jobs list',
    code: RESPONSE_CODES.OK,
    data: result.data
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
    }

    const body = await req.json();
    const validation = jobSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, {
        status: false,
        message: 'Validation Error',
        code: RESPONSE_CODES.VALIDATION_ERROR,
        errors: validation.error.issues
      });
    }

    const result = await JobController.create(validation.data, user.id, '0.0.0.0');
    return sendResponse(201, {
      status: true,
      message: result.message,
      code: RESPONSE_CODES.CREATED,
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

// Update Job
export async function PUT(req: NextRequest) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
    }

    // 2. Parse Body
    const body = await req.json();

    if (!body.id) {
      return sendResponse(400, {
        status: false,
        message: 'Job ID is required',
        code: RESPONSE_CODES.MISSING_REQUIRED_FIELD
      });
    }

    // 3. Update
    const result = await JobController.update(body.id, body, user.id);

    if (!result.success) {
      return sendResponse(400, {
        status: false,
        message: result.message,
        code: result.code
      });
    }

    return sendResponse(200, {
      status: true,
      message: 'Job updated successfully',
      code: RESPONSE_CODES.UPDATED,
      data: result.data
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return sendResponse(500, {
      status: false,
      message: `Internal Server Error: ${error.message}`,
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}