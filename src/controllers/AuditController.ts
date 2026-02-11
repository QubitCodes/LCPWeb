import { AuditLog, User } from '../models';
import { Op } from 'sequelize';

export class AuditController {
  static async list(actor: any) {
    const userWhere: any = {};
    
    // Filter out SUPER_ADMIN logs if actor is not SUPER_ADMIN
    if (actor?.role !== 'SUPER_ADMIN') {
      userWhere.role = { [Op.ne]: 'SUPER_ADMIN' };
    }

    const logs = await AuditLog.findAll({
      include: [
        { 
          model: User, 
          as: 'actor', 
          attributes: ['first_name', 'last_name', 'email', 'role'],
          where: userWhere
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });
    return { success: true, data: logs, code: 100 };
  }
}