import { Company } from '../models';
import { AuditService } from '../services/AuditService';
import { z } from 'zod';

export class CompanyController {

  static async list(query: any) {
    // Basic pagination logic could be added here
    const companies = await (Company as any).findAll({
      order: [['created_at', 'DESC']]
    });
    return { success: true, data: companies, code: 100 };
  }

  static async create(data: any, actorId: string, ip: string) {
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

    return { success: true, message: 'Company created successfully', data: newCompany, code: 101 };
  }

  static async bulkImport(dataArray: any[], actorId: string, ip: string) {
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

    return { 
      success: true, 
      message: `Import complete: ${results.success} succeeded, ${results.failed} failed`, 
      data: results,
      code: 101 
    };
  }
}