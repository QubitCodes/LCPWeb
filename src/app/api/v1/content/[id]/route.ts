import { NextRequest } from 'next/server';
import { ContentItem } from '@/models';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { AuditService } from '@/services/AuditService';

// Schema allows partial updates
const updateSchema = z.object({
  title: z.string().min(2).optional(),
  video_url: z.string().optional(),
  passing_score: z.number().optional(),
  min_watch_percentage: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    const body = await req.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return sendResponse(400, { status: false, message: 'Validation', code: 201 });
    }

    const content = await ContentItem.findByPk(id);
    if (!content) return sendResponse(404, { status: false, message: 'Not found', code: 310 });

    await content.update(validation.data);

    await AuditService.log({
      userId: user.id,
      action: 'UPDATE_CONTENT',
      entityType: 'CONTENT_ITEM',
      entityId: content.id,
      details: validation.data
    });

    return sendResponse(200, { status: true, message: 'Updated', code: 103, data: content });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return sendResponse(403, { status: false, message: 'Forbidden', code: 211 });
    }

    const deleted = await ContentItem.destroy({ where: { id: id } });

    if (!deleted) {
      return sendResponse(404, { status: false, message: 'Not found', code: 310 });
    }

    return sendResponse(200, { status: true, message: 'Deleted', code: 100 });

  } catch (error: any) {
    return sendResponse(500, { status: false, message: error.message, code: 300 });
  }
}