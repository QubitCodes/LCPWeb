import { NextResponse } from 'next/server';
import { AuthController } from '../../../../../controllers/AuthController';
import { sendResponse, RESPONSE_CODES } from '../../../../../utils/responseHandler';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Basic Validation
    if (!body.company_name || !body.supervisor_email || !body.supervisor_password) {
       return sendResponse(400, {
        status: false,
        message: 'Missing required fields',
        code: RESPONSE_CODES.MISSING_REQUIRED_FIELD,
        data: null
      });
    }

    const result = await AuthController.registerCompany(body);
    
    if (result.success) {
      return sendResponse(201, {
        status: true,
        message: result.message,
        code: RESPONSE_CODES.CREATED,
        data: result.data
      });
    }

    return sendResponse(400, {
      status: false,
      message: result.message,
      code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
      data: null
    });

  } catch (error) {
    return sendResponse(500, {
      status: false,
      message: 'Internal server error',
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
      data: null
    });
  }
}
