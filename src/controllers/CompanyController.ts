import { Company, sequelize } from '../models';
import { AuditService } from '../services/AuditService';
import { z } from 'zod';
import { Op } from 'sequelize';
import { QubitRequest } from '../lib/QubitRequest';
import { ServiceResponse, Response, RESPONSE_CODES } from '../utils/responseHandler';

export class CompanyController {

  static async list(req: QubitRequest): Promise<ServiceResponse> {
    // FIX: Explicitly parse inputs as integers to prevent SQL syntax errors in MySQL
    const page = Number(req.input('page', 1));
    const limit = Number(req.input('limit', 10));
    const offset = (page - 1) * limit;
    const search = req.input('search', '');

    // Debugging QubitRequest
    console.log('[CompanyController] Request Debug:', {
      url: req.url.full,
      searchParam: req.url.search,
      inputs: req.all(),
      explicitSearch: search,
      pageType: typeof page,
      limitType: typeof limit
    });

    // Safety check for Sequelize instance
    if (!sequelize) {
      throw new Error('Sequelize instance is undefined. Check models/index.ts exports.');
    }

    const whereClause: any = {};

    // Determine dialect for case-insensitive search
    const dialect = sequelize.getDialect();
    const likeOp = dialect === 'postgres' ? Op.iLike : Op.like;

    if (search) {
      whereClause[Op.or] = [
        { name: { [likeOp]: `%${search}%` } },
        { company_id: { [likeOp]: `%${search}%` } },
        { contact_email: { [likeOp]: `%${search}%` } }
      ];
    }

    const { count, rows } = await (Company as any).findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    return Response.success(rows, 'Companies retrieved successfully', RESPONSE_CODES.OK, {
      total: count,
      page: page,
      limit: limit,
      pages: Math.ceil(count / limit)
    });
  }

  static async create(data: any, actorId: string, ip: string): Promise<ServiceResponse> {
    // Generate 6-digit company_id
    const generated_id = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Create Company
    const newCompany = await (Company as any).create({
      name: data.name,
      company_id: generated_id,
      industry_id: data.industry_id,
      address: data.address,
      website: data.website,
      tax_id: data.tax_id,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      status: 'ACTIVE', // Default to active for admin creation
      approval_status: 'APPROVED'
    });

    // 2. Log Action
    await AuditService.log({
      userId: actorId,
      action: 'CREATE_COMPANY',
      entityType: 'COMPANY',
      entityId: newCompany.id,
      details: { name: newCompany.name },
      ipAddress: ip
    });

    return Response.success(newCompany, 'Company created successfully', RESPONSE_CODES.CREATED);
  }

  static async bulkImport(dataArray: any[], actorId: string, ip: string): Promise<ServiceResponse> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const item of dataArray) {
      try {
        // Validation schema for bulk item
        const schema = z.object({
          name: z.string().min(1),
          industry_id: z.string().uuid().optional(),
          tax_id: z.string().optional(),
          address: z.string().optional(),
          website: z.string().optional(),
          contact_email: z.string().email().optional().or(z.literal('')),
          contact_phone: z.string().optional()
        });

        const validatedData = schema.parse(item);

        await this.create(validatedData, actorId, ip);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${results.success + results.failed}: ${error.message}`);
      }
    }

    return Response.success(
      results,
      `Import complete: ${results.success} succeeded, ${results.failed} failed`,
      RESPONSE_CODES.CREATED
    );
  }

  static async update(id: string, data: any, actorId: string): Promise<ServiceResponse> {
    try {
      const company = await (Company as any).findByPk(id);
      if (!company) {
        return { status: false, message: 'Company not found', code: 310, data: null };
      }

      const allowedFields = ['name', 'industry_id', 'address', 'website', 'tax_id', 'contact_email', 'contact_phone', 'status', 'approval_status'];
      const updateData: any = {};

      allowedFields.forEach(field => {
        if (data[field] !== undefined) updateData[field] = data[field];
      });

      await company.update(updateData);

      // Log
      await AuditService.log({
        userId: actorId,
        action: 'UPDATE_COMPANY',
        entityType: 'COMPANY',
        entityId: company.id,
        details: updateData,
        ipAddress: '0.0.0.0'
      });

      return Response.success(company, 'Company updated successfully', RESPONSE_CODES.UPDATED);
    } catch (error: any) {
      console.error('Update Company Error:', error);
      return { status: false, message: error.message, code: 300, data: null };
    }
  }
}