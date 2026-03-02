import { NextResponse } from 'next/server';
import { sendResponse, RESPONSE_CODES } from '../../../../../utils/responseHandler';

/**
 * @deprecated Use /api/v1/auth/register-supervisor (Step 1) and
 * /api/v1/company/onboarding (Steps 2-3) instead.
 *
 * This legacy endpoint is kept for backward compatibility but returns
 * a notice directing clients to the new multi-step flow.
 */
export async function POST(req: Request) {
  return sendResponse(400, {
    status: false,
    message: 'This endpoint is deprecated. Use /api/v1/auth/register-supervisor for Step 1 and /api/v1/company/onboarding for Steps 2-3.',
    code: RESPONSE_CODES.GENERAL_CLIENT_ERROR,
    data: null
  });
}
