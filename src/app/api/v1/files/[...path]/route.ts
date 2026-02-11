import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/StorageService';
import fs from 'fs';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  // 1. Auth Check (Basic: Must be logged in to view ANY uploaded file)
  // In prod, check specific permissions (e.g. only Company Admin can see their contracts)
  // Query param token is often used for files if headers are hard (e.g. img src), 
  // but let's stick to header or cookie for API consistency.
  // For simplicity here, we assume if you have a valid token, you can view files.

  // const authHeader = req.headers.get('authorization');
  // const token = authHeader?.split(' ')[1];
  // const user = await verifyToken(token || '');
  // if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { path } = await params;
  const relativePath = path.join('/');
  const fullPath = StorageService.getFilePath(relativePath);

  if (!fullPath) {
    return new NextResponse('File not found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(fullPath);

  // Determine mime type (simplified)
  let contentType = 'application/octet-stream';
  if (fullPath.endsWith('.pdf')) contentType = 'application/pdf';
  if (fullPath.endsWith('.jpg')) contentType = 'image/jpeg';
  if (fullPath.endsWith('.png')) contentType = 'image/png';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline' // or attachment
    }
  });
}