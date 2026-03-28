import { NextRequest } from 'next/server';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import SystemSetting from '@/models/SystemSetting';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const setting = await SystemSetting.findOne({ where: { key: 'mobile_app_links' } });
        
        const data = setting ? setting.value : {
            android_app_url: '',
            ios_app_url: '',
            enable_android: false,
            enable_ios: false
        };

        return sendResponse(200, {
            status: true,
            message: 'Public settings retrieved',
            code: RESPONSE_CODES.OK,
            data
        });
    } catch (error) {
        console.error('Settings GET Error:', error);
        return sendResponse(500, {
            status: false,
            message: 'Internal server error',
            code: RESPONSE_CODES.GENERAL_SERVER_ERROR
        });
    }
}
