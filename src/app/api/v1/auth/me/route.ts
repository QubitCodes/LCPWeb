import { NextRequest } from 'next/server';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { User, Company } from '@/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile data.
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        const decoded = await verifyToken(token || '');

        if (!decoded) {
            return sendResponse(401, {
                status: false,
                message: 'Unauthorized',
                code: RESPONSE_CODES.AUTHENTICATION_ERROR
            });
        }

        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password_hash', 'deleted_at'] },
            include: [
                { model: Company, as: 'company', attributes: ['id', 'name'] }
            ]
        });

        if (!user) {
            return sendResponse(404, {
                status: false,
                message: 'User not found',
                code: RESPONSE_CODES.RESOURCE_NOT_FOUND
            });
        }

        return sendResponse(200, {
            status: true,
            message: 'Profile retrieved',
            code: RESPONSE_CODES.OK,
            data: user
        });

    } catch (error: any) {
        console.error('GET /auth/me error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal Server Error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR
        });
    }
}

/**
 * PUT /api/v1/auth/me
 * Updates the currently authenticated user's profile.
 * Only allows updating safe fields (name, phone, etc.).
 */
export async function PUT(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        const decoded = await verifyToken(token || '');

        if (!decoded) {
            return sendResponse(401, {
                status: false,
                message: 'Unauthorized',
                code: RESPONSE_CODES.AUTHENTICATION_ERROR
            });
        }

        const body = await req.json();

        /** Only allow updating safe profile fields — no role, company, or password changes. */
        const ALLOWED_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'country_code', 'years_experience'];
        const updates: Record<string, any> = {};
        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined) {
                updates[key] = body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return sendResponse(400, {
                status: false,
                message: 'No valid fields to update',
                code: RESPONSE_CODES.MISSING_REQUIRED_FIELD
            });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) {
            return sendResponse(404, {
                status: false,
                message: 'User not found',
                code: RESPONSE_CODES.RESOURCE_NOT_FOUND
            });
        }

        await user.update(updates);

        /** Re-fetch with company included */
        const updatedUser = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password_hash', 'deleted_at'] },
            include: [
                { model: Company, as: 'company', attributes: ['id', 'name'] }
            ]
        });

        return sendResponse(200, {
            status: true,
            message: 'Profile updated successfully',
            code: RESPONSE_CODES.UPDATED,
            data: updatedUser
        });

    } catch (error: any) {
        console.error('PUT /auth/me error:', error);
        return sendResponse(500, {
            status: false,
            message: `Internal Server Error: ${error.message}`,
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR
        });
    }
}
