import { NextRequest } from 'next/server';
import { CompanyController } from '@/controllers/CompanyController';
import { sendResponse, RESPONSE_CODES } from '@/utils/responseHandler';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = await verifyToken(token || '');

    if (!user) {
      return sendResponse(401, {
        status: false,
        message: 'Unauthorized',
        code: RESPONSE_CODES.AUTHENTICATION_ERROR
      });
    }

    // 2. Parse Multipart
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return sendResponse(400, {
        status: false,
        message: 'No file uploaded',
        code: RESPONSE_CODES.MISSING_REQUIRED_FIELD
      });
    }

    const csvContent = await file.text();
    const dataArray = csvToJson(csvContent);

    // 3. Controller Action
    const result = await CompanyController.bulkImport(dataArray, user.id, '0.0.0.0');

    return sendResponse(201, {
      status: true,
      message: result.message,
      code: RESPONSE_CODES.CREATED,
      data: result.data
    });

  } catch (error) {
    console.error('Bulk API Error:', error);
    return sendResponse(500, {
      status: false,
      message: 'Internal Server Error',
      code: RESPONSE_CODES.GENERAL_SERVER_ERROR
    });
  }
}

/**
 * Simple CSV to JSON converter
 * Handles standard CSV with headers. 
 * Does not handle complex quoted fields with commas for now.
 */
function csvToJson(csv: string) {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: any = {};
    headers.forEach((header, i) => {
      // Map common CSV headers to model field names if needed
      let field = header.toLowerCase().replace(/ /g, '_');
      // Normalize 'registration_number' to 'company_id' or vice versa if needed
      if (field === 'registration_number') field = 'company_id';

      obj[field] = values[i];
    });
    return obj;
  });
}
