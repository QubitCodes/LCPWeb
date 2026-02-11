import { AuditLog } from '../models';

interface LogParams {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}

export class AuditService {
  static async log({ userId, action, entityType, entityId, details, ipAddress }: LogParams) {
    if (process.env.ENABLE_AUDIT_LOG === 'false') return;

    try {
      await (AuditLog as any).create({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details,
        ip_address: ipAddress || '0.0.0.0'
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Fail silently to not disrupt main flow
    }
  }
}