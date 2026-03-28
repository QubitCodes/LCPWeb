import { NextRequest } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { verifyToken } from '@/lib/auth';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import SystemSetting from '@/models/SystemSetting';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function authenticateAdmin(req: Request) {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;
    const user = await verifyToken(token);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) return null;
    return user;
}

export async function GET(req: NextRequest) {
    try {
        noStore();
        const user = await authenticateAdmin(req);
        if (!user) {
            return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHORIZATION_ERROR });
        }

        // Enforce raw query bypass to prevent Sequelize class proxy serialization faults on generic objects
        const settings = await SystemSetting.findAll({ raw: true });
        
        // Convert to a dictionary for easier client consumption
        const settingsDict = settings.reduce((acc: any, s: any) => {
            let parsedValue = s.value;
            try {
                // Safely reconstruct stored objects/arrays/booleans if possible
                if (typeof s.value === 'string') {
                    parsedValue = JSON.parse(s.value);
                }
            } catch (e) {
                // If it crashes, it's just a raw text string, which is perfectly fine.
            }
            acc[s.key] = parsedValue;
            return acc;
        }, {});

        return sendResponse(200, {
            status: true,
            message: 'Settings retrieved',
            code: RESPONSE_CODES.OK,
            data: settingsDict
        });
    } catch (error) {
        console.error('Settings GET Error:', error);
        const errMsg = error instanceof Error ? error.message : String(error);
        return sendResponse(500, { status: false, message: `System Error [GET]: ${errMsg}`, code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        // const user = await authenticateAdmin(req);
        // if (!user) {
        //     return sendResponse(401, { status: false, message: 'Unauthorized', code: RESPONSE_CODES.AUTHORIZATION_ERROR });
        // }

        const body = await req.json();
        const { key, value, description } = body;

        if (!key) {
            return sendResponse(400, { status: false, message: 'Setting key is required', code: RESPONSE_CODES.MISSING_REQUIRED_FIELD });
        }

        // Securely serialize everything down to a predictable textual root to satisfy Postgres text-column mapping
        const valToSave = typeof value === 'object' ? JSON.stringify(value) : String(value);

        const [setting, created] = await SystemSetting.findOrCreate({
            where: { key },
            defaults: { key, value: valToSave, description }
        });

        if (!created) {
            // Sequelize JSONB type strictly requires manual flag mapping for primitive flips
            setting.changed('value', true);
            setting.setDataValue('value', valToSave);
            
            if (description !== undefined) {
                setting.description = description;
            }
            await setting.save();
        }

        return sendResponse(200, {
            status: true,
            message: 'Setting updated successfully',
            code: RESPONSE_CODES.UPDATED,
            data: setting
        });
    } catch (error) {
        console.error('Settings PATCH Error:', error);
        const errMsg = error instanceof Error ? error.message : String(error);
        return sendResponse(500, { status: false, message: `System Error [PATCH]: ${errMsg}`, code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
    }
}
