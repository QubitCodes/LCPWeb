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
 * /api/v1/surveys/{id}:
 *   get:
 *     summary: Get template with full structure (sections → questions → options)
 *     tags: [Surveys]
 *   patch:
 *     summary: Update a survey template
 *     tags: [Surveys]
 *   delete:
 *     summary: Soft-delete a survey template
 *     tags: [Surveys]
 */

/**
 * GET — Get full template detail.
 */
export async function GET(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { id } = await context.params;
		const result = await SurveyController.getTemplate(id);

		if (!result.success) {
			return sendResponse(404, { status: false, message: result.message || 'Not found', code: RESPONSE_CODES.RESOURCE_NOT_FOUND });
		}

		return sendResponse(200, { status: true, message: 'Template details', code: RESPONSE_CODES.OK, data: result.data });
	} catch (error) {
		console.error('Survey [id] GET Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}

/**
 * PATCH — Update template metadata.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { id } = await context.params;
		const body = await req.json();
		const result = await SurveyController.updateTemplate(id, body, user.id);

		if (!result.success) {
			return sendResponse(result.code === 310 ? 404 : 400, {
				status: false,
				message: result.message || 'Update failed',
				code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
			});
		}

		return sendResponse(200, { status: true, message: result.message, code: RESPONSE_CODES.UPDATED, data: result.data });
	} catch (error) {
		console.error('Survey [id] PATCH Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}

/**
 * DELETE — Soft-delete a template.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { id } = await context.params;
		const { searchParams } = new URL(req.url);
		const reason = searchParams.get('reason') || undefined;

		const result = await SurveyController.deleteTemplate(id, user.id, reason);

		if (!result.success) {
			return sendResponse(404, { status: false, message: result.message || 'Not found', code: RESPONSE_CODES.RESOURCE_NOT_FOUND });
		}

		return sendResponse(200, { status: true, message: result.message, code: RESPONSE_CODES.OK, data: null });
	} catch (error) {
		console.error('Survey [id] DELETE Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}
