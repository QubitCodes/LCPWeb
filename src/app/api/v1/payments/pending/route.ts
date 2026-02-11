import { NextRequest } from 'next/server';
import { Payment, Order, Company, User } from '@/models';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    const pendingPayments = await Payment.findAll({
      where: { status: 'PENDING', provider: 'MANUAL' },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Company, as: 'company', attributes: ['name'] },
            { model: User, as: 'ordered_by', attributes: ['first_name', 'last_name', 'email'] }
          ]
        }
      ],
      order: [['created_at', 'ASC']]
    });

    return sendResponse(200, {
      status: true,
      message: 'Pending Payments',
      code: RESPONSE_CODES.OK,
      data: pendingPayments
    });

  } catch (error) {
    return sendResponse(500, { status: false, message: 'Server Error', code: 300 });
  }
}