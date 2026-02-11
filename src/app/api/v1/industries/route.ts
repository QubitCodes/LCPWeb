import { NextResponse } from 'next/server';
import { IndustryController } from '../../../../controllers/IndustryController';
import { sendResponse, RESPONSE_CODES } from '../../../../utils/responseHandler';

export async function GET() {
  const result = await IndustryController.list();
  
  if (result.success) {
    return sendResponse(200, {
      status: true,
      message: 'Industries list',
      code: RESPONSE_CODES.OK,
      data: result.data
    });
  }

  return sendResponse(500, {
    status: false,
    message: result.message || 'Error fetching industries',
    code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
    data: null
  });
}
