import { NextRequest } from 'next/server';
import { UserController } from '@/controllers/UserController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { UserRole } from '@/models/User';

export const dynamic = 'force-dynamic';

const createUserSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
  company_id: z.string().uuid().optional().or(z.literal('')), // Optional for Admin, required for others logic handled in controller/frontend
  phone_number: z.string().optional(),
  years_experience: z.number().optional().or(z.string().transform(v => parseInt(v, 10))),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const company_id = url.searchParams.get('company_id');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    // Allow list but filter inside controller based on role
    // Default to empty actor if no token (though middleware likely blocks generic access, this is defensive)
    const result = await UserController.list({ role, company_id }, user);

    return sendResponse(200, {
      status: true,
      message: 'Users retrieved',
      code: RESPONSE_CODES.OK,
      data: result.data
    });
  } catch (error) {
    console.error('API Error:', error);
    return sendResponse(500, {
      status: false,
      message: 'Internal Error',
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, {
        status: false,
        message: 'Unauthorized',
        code: RESPONSE_CODES.AUTHENTICATION_ERROR
      });
    }

    // 2. Parse Data (Support both JSON and FormData for flexibility)
    let rawData;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      rawData = Object.fromEntries(formData);
    } else {
      rawData = await req.json();
    }

    // 3. Validate
    const validation = createUserSchema.safeParse(rawData);
    if (!validation.success) {
      return sendResponse(400, {
        status: false,
        message: 'Validation Error',
        code: RESPONSE_CODES.VALIDATION_ERROR,
        errors: validation.error.issues
      });
    }

    // 4. Create
    const result = await UserController.create(validation.data, user.id, '0.0.0.0');

    if (!result.success) {
      return sendResponse(400, { // Business logic error (e.g., email exists)
        status: false,
        message: result.message,
        code: result.code
      });
    }

    return sendResponse(201, {
      status: true,
      message: result.message,
      code: RESPONSE_CODES.CREATED,
      data: result.data
    });

  } catch (error) {
    console.error('API Error:', error);
    return sendResponse(500, {
      status: false,
      message: 'Internal Server Error',
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}

// Update User
export async function PUT(req: NextRequest) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, {
        status: false,
        message: 'Unauthorized',
        code: RESPONSE_CODES.AUTHENTICATION_ERROR
      });
    }

    // 2. Parse Body
    const body = await req.json();

    // 3. Simple Validation
    if (!body.id) {
      return sendResponse(400, {
        status: false,
        message: 'User ID is required',
        code: RESPONSE_CODES.MISSING_REQUIRED_FIELD
      });
    }

    // 4. Update
    const result = await UserController.update(body.id, body, user);

    if (!result.success) {
      return sendResponse(400, {
        status: false,
        message: result.message,
        code: result.code
      });
    }

    return sendResponse(200, {
      status: true,
      message: 'User updated successfully',
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