import { NextRequest } from 'next/server';
import { Certificate, CourseLevel, Course } from '@/models';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: 210 });

    const certs = await Certificate.findAll({
      where: { worker_id: user.id },
      include: [
        {
          model: CourseLevel,
          as: 'level',
          include: [{ model: Course, as: 'course', attributes: ['title'] }]
        }
      ],
      order: [['issue_date', 'DESC']]
    });

    return sendResponse(200, {
      status: true,
      message: 'My Certificates',
      code: RESPONSE_CODES.OK,
      data: certs
    });
  } catch (error) {
    return sendResponse(500, { status: false, message: 'Server Error', code: 300 });
  }
}