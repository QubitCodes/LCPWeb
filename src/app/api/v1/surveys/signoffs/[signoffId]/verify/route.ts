import { NextRequest } from 'next/server';
import { SurveyController } from '@/controllers/SurveyController';
import { verifyToken } from '@/lib/auth';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';

export const dynamic = 'force-dynamic';

/** Authenticate from Bearer token */
async function authenticateRequest(req: Request) {
	const token = req.headers.get('authorization')?.split(' ')[1];
	if (!token) return null;
	const user = await verifyToken(token);
	return user?.id ? user : null;
}

type RouteContext = { params: Promise<{ signoffId: string }> };

/**
 * @swagger
 * /api/v1/surveys/signoffs/{signoffId}/verify:
 *   post:
 *     summary: Verify OTP for a sign-off
 *     tags: [Surveys - Signoffs]
 */

/**
 * POST — Verify OTP for a sign-off.
 * Body: { otp: string }
 */
export async function POST(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { signoffId } = await context.params;
		const body = await req.json();

		if (!body.otp) {
			return sendResponse(400, { status: false, message: 'OTP is required', code: RESPONSE_CODES.MISSING_REQUIRED_FIELD });
		}

		const result = await SurveyController.verifyOtpSignoff(signoffId, body.otp);

		if (result.success) {
			return sendResponse(200, { status: true, message: result.message, code: RESPONSE_CODES.UPDATED, data: result.data });
		}

		return sendResponse(
			result.code === 310 ? 404 : 400,
			{ status: false, message: result.message, code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR }
		);
	} catch (error) {
		console.error('Verify OTP Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}
