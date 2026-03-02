import { NextResponse } from 'next/server';
import { AuthController } from '../../../../../controllers/AuthController';
import { verifyToken } from '@/lib/auth';
import { sendResponse, RESPONSE_CODES } from '../../../../../utils/responseHandler';

/**
 * @swagger
 * /api/v1/company/onboarding:
 *   post:
 *     summary: Step 2 — Register company details (auth required)
 *     tags: [Company Onboarding]
 *   put:
 *     summary: Step 3 — Add first site (auth required)
 *     tags: [Company Onboarding]
 *   patch:
 *     summary: Step 4 — Review & complete onboarding (auth required)
 *     tags: [Company Onboarding]
 */

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
 * POST — Step 2: Create company and link to authenticated ADMIN_SUPERVISOR.
 */
export async function POST(req: Request) {
    try {
        const user = await authenticateRequest(req);
        if (!user) {
            return sendResponse(401, {
                status: false,
                message: 'Authentication required',
                code: RESPONSE_CODES.AUTHENTICATION_ERROR,
                data: null
            });
        }

        const body = await req.json();

        if (!body.company_name) {
            return sendResponse(400, {
                status: false,
                message: 'Missing required field: company_name',
                code: RESPONSE_CODES.MISSING_REQUIRED_FIELD,
                data: null
            });
        }

        const result = await AuthController.onboardCompany(user.id, body);

        if (result.success) {
            return sendResponse(201, {
                status: true,
                message: result.message,
                code: RESPONSE_CODES.CREATED,
                data: result.data
            });
        }

        return sendResponse(400, {
            status: false,
            message: result.message,
            code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
            data: null
        });

    } catch (error) {
        console.error('Company Onboarding POST Error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal server error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
            data: null
        });
    }
}

/**
 * PUT — Step 3: Add first site to the company.
 */
export async function PUT(req: Request) {
    try {
        const user = await authenticateRequest(req);
        if (!user) {
            return sendResponse(401, {
                status: false,
                message: 'Authentication required',
                code: RESPONSE_CODES.AUTHENTICATION_ERROR,
                data: null
            });
        }

        const body = await req.json();

        if (!body.site_name) {
            return sendResponse(400, {
                status: false,
                message: 'Missing required field: site_name',
                code: RESPONSE_CODES.MISSING_REQUIRED_FIELD,
                data: null
            });
        }

        const result = await AuthController.addOnboardingSite(user.id, body);

        if (result.success) {
            return sendResponse(201, {
                status: true,
                message: result.message,
                code: RESPONSE_CODES.CREATED,
                data: result.data
            });
        }

        return sendResponse(400, {
            status: false,
            message: result.message,
            code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
            data: null
        });

    } catch (error) {
        console.error('Company Onboarding PUT Error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal server error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
            data: null
        });
    }
}

/**
 * PATCH — Step 4: Review & complete onboarding.
 */
export async function PATCH(req: Request) {
    try {
        const user = await authenticateRequest(req);
        if (!user) {
            return sendResponse(401, {
                status: false,
                message: 'Authentication required',
                code: RESPONSE_CODES.AUTHENTICATION_ERROR,
                data: null
            });
        }

        const body = await req.json();

        const result = await AuthController.completeOnboarding(user.id, body);

        if (result.success) {
            return sendResponse(200, {
                status: true,
                message: result.message,
                code: RESPONSE_CODES.OK,
                data: result.data
            });
        }

        return sendResponse(400, {
            status: false,
            message: result.message,
            code: result.code || RESPONSE_CODES.GENERAL_CLIENT_ERROR,
            data: null
        });

    } catch (error) {
        console.error('Company Onboarding PATCH Error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal server error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR,
            data: null
        });
    }
}
