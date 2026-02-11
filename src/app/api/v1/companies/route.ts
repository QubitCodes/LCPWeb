import { NextRequest } from 'next/server';
import { CompanyController } from '@/controllers/CompanyController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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

export async function GET(req: NextRequest) {
  try {
    // In a real app, verify token here
    // const authHeader = req.headers.get('authorization');
    // ... verify logic ...

    const result = await CompanyController.list({});
    return sendResponse(200, {
      status: true,
      message: 'Companies retrieved',
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