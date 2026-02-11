import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/StorageService';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) return sendResponse(401, { status: false, message: 'Unauthorized', code: 210 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'misc';

    if (!file) {
      return sendResponse(400, { status: false, message: 'No file provided', code: 202 });
    }

    // Security check on folder name to prevent directory traversal
    if (folder.includes('..') || folder.includes('/')) {
      return sendResponse(400, { status: false, message: 'Invalid folder', code: 203 });
    }

    const path = await StorageService.upload(file, folder);

    return sendResponse(201, {
      status: true,
      message: 'File uploaded',
      code: 101,
      data: { path, url: `/api/v1/files${path}` } // Construct public facing URL
    });

  } catch (error: any) {
    console.error(error);
    return sendResponse(500, { status: false, message: 'Upload failed', code: 300 });
  }
}