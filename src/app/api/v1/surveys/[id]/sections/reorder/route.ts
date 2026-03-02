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

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/v1/surveys/{id}/sections/reorder:
 *   patch:
 *     summary: Reorder sections within a template
 *     tags: [Surveys - Sections]
 */

/**
 * PATCH — Reorder sections for a template.
 * Body: { order: [{ id, sequence_order }] }
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { id } = await context.params;
		const body = await req.json();

		if (!body.order || !Array.isArray(body.order)) {
			return sendResponse(400, { status: false, message: 'order array is required', code: RESPONSE_CODES.MISSING_REQUIRED_FIELD });
		}

		const result = await SurveyController.reorderSections({ template_id: id, order: body.order });

		if (result.success) {
			return sendResponse(200, { status: true, message: result.message, code: RESPONSE_CODES.UPDATED, data: null });
		}

		return sendResponse(400, { status: false, message: result.message || 'Reorder failed', code: RESPONSE_CODES.GENERAL_CLIENT_ERROR });
	} catch (error) {
		console.error('Sections Reorder Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}
