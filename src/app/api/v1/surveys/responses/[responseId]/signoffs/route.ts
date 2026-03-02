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

type RouteContext = { params: Promise<{ responseId: string }> };

/**
 * @swagger
 * /api/v1/surveys/responses/{responseId}/signoffs:
 *   get:
 *     summary: List all signoffs for a response
 *     tags: [Surveys - Signoffs]
 *   post:
 *     summary: Add a drawn signature or request OTP sign-off
 *     tags: [Surveys - Signoffs]
 */

/**
 * GET — List signoffs for a response.
 */
export async function GET(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { responseId } = await context.params;
		const result = await SurveyController.listSignoffs(responseId);

		return sendResponse(200, { status: true, message: 'Signoffs', code: RESPONSE_CODES.OK, data: result.data });
	} catch (error) {
		console.error('Signoffs GET Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}

/**
 * POST — Add a sign-off.
 * Body: { sign_method: 'DRAW' | 'OTP', name, designation?, signature_data? }
 */
export async function POST(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { responseId } = await context.params;
		const body = await req.json();

		let result;
		if (body.sign_method === 'OTP') {
			result = await SurveyController.requestOtpSignoff(
				{ response_id: responseId, name: body.name, designation: body.designation },
				user.id
			);
		} else {
			// Default: DRAW
			result = await SurveyController.addDrawnSignoff(
				{ response_id: responseId, name: body.name, designation: body.designation, signature_data: body.signature_data },
				user.id
			);
		}

		if (result.success) {
			return sendResponse(201, { status: true, message: result.message, code: RESPONSE_CODES.CREATED, data: result.data });
		}

		return sendResponse(
			result.code === 310 ? 404 : 400,
			{ status: false, message: result.message, code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR }
		);
	} catch (error) {
		console.error('Signoffs POST Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}
