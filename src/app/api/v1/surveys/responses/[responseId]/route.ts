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
 * /api/v1/surveys/responses/{responseId}:
 *   get:
 *     summary: Get response with full template structure and saved answers (fill view)
 *     tags: [Surveys - Responses]
 *   patch:
 *     summary: Upsert answers (auto-save)
 *     tags: [Surveys - Responses]
 *   post:
 *     summary: Complete and submit the survey response
 *     tags: [Surveys - Responses]
 */

/**
 * GET — Get response with full template structure + saved answers (for filling UI).
 */
export async function GET(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { responseId } = await context.params;
		const result = await SurveyController.getResponseForFilling(responseId);

		if (!result.success) {
			return sendResponse(404, { status: false, message: result.message || 'Not found', code: RESPONSE_CODES.RESOURCE_NOT_FOUND });
		}

		return sendResponse(200, { status: true, message: 'Response details', code: RESPONSE_CODES.OK, data: result.data });
	} catch (error) {
		console.error('Response GET Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}

/**
 * PATCH — Upsert answers (auto-save / batch save).
 * Body: { answers: [{ question_id, answer_text?, answer_json? }] }
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { responseId } = await context.params;
		const body = await req.json();

		if (!body.answers || !Array.isArray(body.answers)) {
			return sendResponse(400, { status: false, message: 'answers array is required', code: RESPONSE_CODES.MISSING_REQUIRED_FIELD });
		}

		const result = await SurveyController.upsertAnswers(responseId, body.answers, user.id);

		if (!result.success) {
			const httpStatus = result.code === 310 ? 404 : result.code === 212 ? 403 : 400;
			return sendResponse(httpStatus, { status: false, message: result.message, code: result.code });
		}

		return sendResponse(200, { status: true, message: result.message, code: RESPONSE_CODES.UPDATED, data: result.data });
	} catch (error) {
		console.error('Response PATCH Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}

/**
 * POST — Complete and submit the survey response.
 * Validates all required questions are answered before marking COMPLETED.
 */
export async function POST(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { responseId } = await context.params;
		const result = await SurveyController.completeResponse(responseId, user.id);

		if (!result.success) {
			const httpStatus = result.code === 310 ? 404 : result.code === 212 ? 403 : 400;
			return sendResponse(httpStatus, {
				status: false,
				message: result.message,
				code: result.code,
				data: result.data || null,
			});
		}

		return sendResponse(200, { status: true, message: result.message, code: RESPONSE_CODES.UPDATED, data: result.data });
	} catch (error) {
		console.error('Response POST Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}
