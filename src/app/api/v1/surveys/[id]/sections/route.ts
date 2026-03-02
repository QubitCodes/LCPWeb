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
 * /api/v1/surveys/{id}/sections:
 *   post:
 *     summary: Add a section to a survey template
 *     tags: [Surveys - Sections]
 */

/**
 * POST — Create a new section within a template.
 */
export async function POST(req: NextRequest, context: RouteContext) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { id } = await context.params;
		const body = await req.json();

		const result = await SurveyController.createSection(
			{ ...body, template_id: id },
			user.id
		);

		if (result.success) {
			return sendResponse(201, { status: true, message: result.message, code: RESPONSE_CODES.CREATED, data: result.data });
		}

		return sendResponse(400, {
			status: false,
			message: result.message || 'Failed to create section',
			code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
		});
	} catch (error) {
		console.error('Sections POST Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}
