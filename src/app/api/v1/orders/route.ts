import { NextRequest } from 'next/server';
import { OrderController } from '@/controllers/OrderController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const orderSchema = z.object({
  items: z.array(z.object({
    worker_id: z.string().uuid(),
    course_level_id: z.string().uuid(),
    price: z.number().positive()
  }))
});

export async function GET() {
  const result = await OrderController.listEnrollments();
  return sendResponse(200, { status: true, message: 'Enrollments', code: 100, data: result.data });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: 210 });

    const body = await req.json();
    const validation = orderSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Validation', code: 201, errors: validation.error.issues });
    }

    // 1. Create Order
    const orderResult = await OrderController.createOrder(user.id, user.company_id, validation.data.items, user.id);

    // 2. Auto-pay (Mocking the flow for demo purposes)
    // In real world, we would return the order ID, and frontend would start Stripe Checkout or upload Proof
    await OrderController.processPayment(
      orderResult.data.id,
      'MANUAL',
      orderResult.data.total_amount,
      'auto_generated_proof.pdf'
    );

    return sendResponse(201, { status: true, message: 'Order created and Paid', code: 101, data: orderResult.data });

  } catch (error) {
    console.error(error);
    return sendResponse(500, { status: false, message: 'Server Error', code: 300 });
  }
}