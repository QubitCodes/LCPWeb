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

type RouteContext = { params: Promise<{ questionId: string }> };

/**
 * @swagger
 * /api/v1/surveys/questions/{questionId}:
 *   patch:
 *     summary: Update a question (and optionally replace its options)
 *     tags: [Surveys - Questions]
 *   delete:
 *     summary: Soft-delete a question
 *     tags: [Surveys - Questions]
 */

/**
 * PATCH — Update a question and optionally replace options.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { questionId } = await context.params;
		const body = await req.json();
		const result = await SurveyController.updateQuestion(questionId, body, user.id);

		if (!result.success) {
			return sendResponse(result.code === 310 ? 404 : 400, {
				status: false,
				message: result.message || 'Update failed',
				code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
			});
		}

		return sendResponse(200, { status: true, message: result.message, code: RESPONSE_CODES.UPDATED, data: result.data });
	} catch (error) {
		console.error('Question PATCH Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}

/**
 * DELETE — Soft-delete a question.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { questionId } = await context.params;
		const result = await SurveyController.deleteQuestion(questionId, user.id);

		if (!result.success) {
			return sendResponse(404, { status: false, message: result.message || 'Not found', code: RESPONSE_CODES.RESOURCE_NOT_FOUND });
		}

		return sendResponse(200, { status: true, message: result.message, code: RESPONSE_CODES.OK, data: null });
	} catch (error) {
		console.error('Question DELETE Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}
