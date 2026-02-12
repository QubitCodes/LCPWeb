import { NextRequest } from 'next/server';
import { CompanyController } from '@/controllers/CompanyController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { Api } from '@/lib/QubitRequest';

export const dynamic = 'force-dynamic';

// GET - API using QubitRequest
export const GET = Api(async (req) => {
  try {
    const result = await CompanyController.list(req);

    // Pass the standard response from controller directly
    return sendResponse(200, result);

  } catch (error: any) {
    console.error('API Error:', error);
    // Return detailed error message for debugging "Internal Error"
    return sendResponse(500, {
      status: false,
      message: `Internal Error: ${error.message || String(error)}`,
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
      errors: [{ detail: error.stack }]
    });
  }
});

// Schema for Validation
const createCompanySchema = z.object({
  name: z.string().min(2),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  industry_id: z.string().uuid().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  tax_id: z.string().optional(),
});

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

    // 2. Parse Multipart/Form-Data
    const formData = await req.formData();
    const rawData = {
      name: formData.get('name') as string,
      contact_email: formData.get('contact_email') as string,
      contact_phone: formData.get('contact_phone') as string,
      industry_id: formData.get('industry_id') as string,
      address: formData.get('address') as string,
      website: formData.get('website') as string,
      tax_id: formData.get('tax_id') as string,
    };

    // 3. Validate
    const validation = createCompanySchema.safeParse(rawData);
    if (!validation.success) {
      return sendResponse(400, {
        status: false,
        message: 'Validation Error',
        code: RESPONSE_CODES.VALIDATION_ERROR,
        errors: validation.error.issues
      });
    }

    // 4. Controller Action
    const result = await CompanyController.create(validation.data, user.id, '0.0.0.0');

    // Pass the standard response from controller directly
    return sendResponse(201, result);

  } catch (error: any) {
    console.error('API Error:', error);
    return sendResponse(500, {
      status: false,
      message: `Internal Server Error: ${error.message}`,
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}

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

    // 2. Parse (Support FormData for updates too, e.g. logo, or JSON)
    let rawData: any = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      rawData = Object.fromEntries(formData);
    } else {
      rawData = await req.json();
    }

    if (!rawData.id) {
      return sendResponse(400, {
        status: false,
        message: 'Company ID is required',
        code: RESPONSE_CODES.MISSING_REQUIRED_FIELD
      });
    }

    // 3. Update
    const result = await CompanyController.update(rawData.id, rawData, user.id);

    if (!result.status) { // Updated to check .status since CompanyController returns ServiceResponse
      return sendResponse(400, result); // Return result directly as it is ServiceResponse
    }

    // Return success
    return sendResponse(200, result);

  } catch (error: any) {
    console.error('API Error:', error);
    return sendResponse(500, {
      status: false,
      message: `Internal Server Error: ${error.message}`,
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}