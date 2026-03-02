import { NextRequest } from 'next/server';
import { SurveyController } from '@/controllers/SurveyController';
import { verifyToken } from '@/lib/auth';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';

export const dynamic = 'force-dynamic';

/**
 * Helper: Extract & verify auth token from request headers.
 * @returns Decoded user payload or null
 */
async function authenticateRequest(req: Request) {
	const token = req.headers.get('authorization')?.split(' ')[1];
	if (!token) return null;
	const user = await verifyToken(token);
	return user?.id ? user : null;
}

/**
 * @swagger
 * /api/v1/surveys:
 *   get:
 *     summary: List all survey templates (with optional filters)
 *     tags: [Surveys]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, DRAFT] }
 *       - name: type
 *         in: query
 *         schema: { type: string, enum: [SURVEY, QUIZ] }
 *       - name: industry_id
 *         in: query
 *         schema: { type: string }
 *   post:
 *     summary: Create a new survey template
 *     tags: [Surveys]
 */

/**
 * GET — List all survey templates.
 */
export async function GET(req: NextRequest) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, {
				status: false,
				message: 'Authentication required',
				code: RESPONSE_CODES.AUTHENTICATION_ERROR,
			});
		}

		const { searchParams } = new URL(req.url);
		const filters: any = {};
		if (searchParams.get('status')) filters.status = searchParams.get('status');
		if (searchParams.get('type')) filters.type = searchParams.get('type');
		if (searchParams.get('industry_id')) filters.industry_id = searchParams.get('industry_id');

		const result = await SurveyController.listTemplates(filters);

		return sendResponse(200, {
			status: true,
			message: 'Survey templates',
			code: RESPONSE_CODES.OK,
			data: result.data,
		});
	} catch (error) {
		console.error('Survey GET Error:', error);
		return sendResponse(500, {
			status: false,
			message: 'Internal Server Error',
			code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
		});
	}
}

/**
 * POST — Create a new survey template.
 */
export async function POST(req: NextRequest) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, {
				status: false,
				message: 'Authentication required',
				code: RESPONSE_CODES.AUTHENTICATION_ERROR,
			});
		}

		const body = await req.json();

		if (!body.name) {
			return sendResponse(400, {
				status: false,
				message: 'Missing required field: name',
				code: RESPONSE_CODES.MISSING_REQUIRED_FIELD,
			});
		}

		const result = await SurveyController.createTemplate(body, user.id);

		if (result.success) {
			return sendResponse(201, {
				status: true,
				message: result.message,
				code: RESPONSE_CODES.CREATED,
				data: result.data,
			});
		}

		return sendResponse(400, {
			status: false,
			message: result.message || 'Failed to create template',
			code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
		});
	} catch (error) {
		console.error('Survey POST Error:', error);
		return sendResponse(500, {
			status: false,
			message: 'Internal Server Error',
			code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
		});
	}
}
