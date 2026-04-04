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
 * /api/v1/companies/{id}/sites:
 *   get:
 *     summary: List all sites for a company
 *     tags: [Company Sites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Company UUID
 */
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
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

		const { id: companyId } = await params;
		const result = await CompanySiteController.list(companyId);

		if (!result.success) {
			return sendResponse(result.code === 310 ? 404 : 500, {
				status: false,
				message: result.message || 'Request failed',
				code: result.code,
			});
		}

		return sendResponse(200, {
			status: true,
			message: 'Company sites',
			code: RESPONSE_CODES.OK,
			data: result.data,
		});
	} catch (error) {
		console.error('Sites GET Error:', error);
		return sendResponse(500, {
			status: false,
			message: 'Internal Server Error',
			code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
		});
	}
}

/** Validation schema for creating a site */
const createSiteSchema = z.object({
	name: z.string().min(1, 'Site name is required'),
	address: z.string().optional(),
	project_stage_id: z.number().int().positive().optional(),
	expected_duration_months: z.number().int().positive().optional(),
	contractor_rep_id: z.string().uuid().optional(),
	site_supervisor_id: z.string().uuid().optional(),
});

/**
 * @swagger
 * /api/v1/companies/{id}/sites:
 *   post:
 *     summary: Create a new site for a company
 *     tags: [Company Sites]
 */
export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
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

		const { id: companyId } = await params;
		const body = await req.json();

		// Validate
		const validation = createSiteSchema.safeParse(body);
		if (!validation.success) {
			return sendResponse(400, {
				status: false,
				message: 'Validation Error',
				code: RESPONSE_CODES.VALIDATION_ERROR,
				errors: validation.error.issues,
			});
		}

		const result = await CompanySiteController.create(companyId, validation.data, user.id);

		if (result.success) {
			return sendResponse(201, {
				status: true,
				message: result.message,
				code: RESPONSE_CODES.CREATED,
				data: result.data,
			});
		}

		return sendResponse(
			result.code === 310 ? 404 : 400,
			{
				status: false,
				message: result.message || 'Failed to create site',
				code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
			}
		);
	} catch (error) {
		console.error('Sites POST Error:', error);
		return sendResponse(500, {
			status: false,
			message: 'Internal Server Error',
			code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
		});
	}
}
