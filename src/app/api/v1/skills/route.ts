import { NextRequest } from 'next/server';
import { SkillController } from '@/controllers/SkillController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({ name: z.string().min(2) });

export async function GET() {
  const result = await SkillController.list();
  return sendResponse(200, {
    status: true,
    message: 'Skills list',
    code: RESPONSE_CODES.OK,
    data: result.data
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createSchema.safeParse(body);
    
    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Invalid data', code: RESPONSE_CODES.VALIDATION_ERROR });
    }

    const result = await SkillController.create(validation.data.name);
    return sendResponse(201, { status: true, message: 'Created', code: RESPONSE_CODES.CREATED, data: result.data });
  } catch (error) {
    return sendResponse(500, { status: false, message: 'Error', code: RESPONSE_CODES.GENERAL_SERVER_ERROR });
  }
}