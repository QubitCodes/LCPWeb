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

/**
 * @swagger
 * /api/v1/surveys/responses:
 *   get:
 *     summary: List survey responses (filter by template_id, company_id, site_id, status)
 *     tags: [Surveys - Responses]
 */

/**
 * GET — List responses with optional filters.
 */
export async function GET(req: NextRequest) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const { searchParams } = new URL(req.url);
		const filters: any = {};
		if (searchParams.get('template_id')) filters.template_id = searchParams.get('template_id');
		if (searchParams.get('company_id')) filters.company_id = searchParams.get('company_id');
		if (searchParams.get('site_id')) filters.site_id = searchParams.get('site_id');
		if (searchParams.get('status')) filters.status = searchParams.get('status');

		const result = await SurveyController.listResponses(filters);

		return sendResponse(200, { status: true, message: 'Survey responses', code: RESPONSE_CODES.OK, data: result.data });
	} catch (error) {
		console.error('Responses GET Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}

/**
 * POST — Create a new response (start filling a survey).
 * Body: { template_id, company_id, site_id? }
 */
export async function POST(req: NextRequest) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, { status: false, message: 'Authentication required', code: RESPONSE_CODES.AUTHENTICATION_ERROR });
		}

		const body = await req.json();
		const result = await SurveyController.createResponse(body, user.id);

		if (result.success) {
			return sendResponse(201, { status: true, message: result.message, code: RESPONSE_CODES.CREATED, data: result.data });
		}

		return sendResponse(
			result.code === 310 ? 404 : 400,
			{ status: false, message: result.message || 'Failed to start survey', code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR }
		);
	} catch (error) {
		console.error('Responses POST Error:', error);
		return sendResponse(500, { status: false, message: 'Internal Server Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
	}
}
