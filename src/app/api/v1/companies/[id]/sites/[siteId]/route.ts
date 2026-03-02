import { NextRequest } from 'next/server';
import { CompanySiteController } from '@/controllers/CompanySiteController';
import { verifyToken } from '@/lib/auth';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { z } from 'zod';

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
 * /api/v1/companies/{id}/sites/{siteId}:
 *   get:
 *     summary: Get a single site with its survey responses
 *     tags: [Company Sites]
 */
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; siteId: string }> }
) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, {
				status: false,
				message: 'Authentication required',
				code: RESPONSE_CODES.AUTHENTICATION_ERROR,
			});
		}

		const { siteId } = await params;
		const result = await CompanySiteController.get(siteId);

		if (!result.success) {
			return sendResponse(result.code === 310 ? 404 : 500, {
				status: false,
				message: result.message || 'Request failed',
				code: result.code,
			});
		}

		return sendResponse(200, {
			status: true,
			message: 'Site details',
			code: RESPONSE_CODES.OK,
			data: result.data,
		});
	} catch (error) {
		console.error('Site GET Error:', error);
		return sendResponse(500, {
			status: false,
			message: 'Internal Server Error',
			code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
		});
	}
}

/** Validation schema for updating a site */
const updateSiteSchema = z.object({
	name: z.string().min(1).optional(),
	address: z.string().optional(),
	project_stage: z.enum(['FOUNDATION', 'STRUCTURE', 'MASONRY', 'FINISHING', 'MEP']).nullable().optional(),
	expected_duration_months: z.number().int().positive().nullable().optional(),
	contractor_rep_id: z.string().uuid().nullable().optional(),
	site_supervisor_id: z.string().uuid().nullable().optional(),
	status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

/**
 * @swagger
 * /api/v1/companies/{id}/sites/{siteId}:
 *   put:
 *     summary: Update a site
 *     tags: [Company Sites]
 */
export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; siteId: string }> }
) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, {
				status: false,
				message: 'Authentication required',
				code: RESPONSE_CODES.AUTHENTICATION_ERROR,
			});
		}

		const { siteId } = await params;
		const body = await req.json();

		const validation = updateSiteSchema.safeParse(body);
		if (!validation.success) {
			return sendResponse(400, {
				status: false,
				message: 'Validation Error',
				code: RESPONSE_CODES.VALIDATION_ERROR,
				errors: validation.error.issues,
			});
		}

		const result = await CompanySiteController.update(siteId, validation.data, user.id);

		if (result.success) {
			return sendResponse(200, {
				status: true,
				message: result.message,
				code: RESPONSE_CODES.UPDATED,
				data: result.data,
			});
		}

		return sendResponse(
			result.code === 310 ? 404 : 400,
			{
				status: false,
				message: result.message || 'Failed to update site',
				code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
			}
		);
	} catch (error) {
		console.error('Site PUT Error:', error);
		return sendResponse(500, {
			status: false,
			message: 'Internal Server Error',
			code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
		});
	}
}

/**
 * @swagger
 * /api/v1/companies/{id}/sites/{siteId}:
 *   delete:
 *     summary: Soft-delete a site
 *     tags: [Company Sites]
 */
export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string; siteId: string }> }
) {
	try {
		const user = await authenticateRequest(req);
		if (!user) {
			return sendResponse(401, {
				status: false,
				message: 'Authentication required',
				code: RESPONSE_CODES.AUTHENTICATION_ERROR,
			});
		}

		const { siteId } = await params;

		let reason: string | undefined;
		try {
			const body = await req.json();
			reason = body.reason;
		} catch {
			// No body is fine
		}

		const result = await CompanySiteController.delete(siteId, user.id, reason);

		if (result.success) {
			return sendResponse(200, {
				status: true,
				message: result.message,
				code: RESPONSE_CODES.OK,
			});
		}

		return sendResponse(
			result.code === 310 ? 404 : 400,
			{
				status: false,
				message: result.message || 'Failed to delete site',
				code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
			}
		);
	} catch (error) {
		console.error('Site DELETE Error:', error);
		return sendResponse(500, {
			status: false,
			message: 'Internal Server Error',
			code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
		});
	}
}
