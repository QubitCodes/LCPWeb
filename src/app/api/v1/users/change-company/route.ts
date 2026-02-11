import { NextRequest } from 'next/server';
import { UserController } from '@/controllers/UserController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  user_id: z.string().uuid(),
  new_company_id: z.string().uuid(),
  reason: z.string().min(3)
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Validation', code: 201 });
    }

    // Logic: Supervisors can only move their own workers? SRS says "Supervisor or Worker can change companies".
    // For now allowing Admin or Supervisor to initiate.

    const result = await UserController.changeCompany(
      validation.data.user_id,
      validation.data.new_company_id,
      validation.data.reason,
      user.id
    );

    return sendResponse(200, { status: true, message: result.message, code: 103 });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}