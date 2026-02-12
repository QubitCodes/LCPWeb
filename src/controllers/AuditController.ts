import { AuditLog, User } from '../models';
import { Op } from 'sequelize';

/**
 * AuditController
 * Handles audit log listing with pagination, filtering, and search.
 */
export class AuditController {

  /**
   * List audit logs with pagination and filters.
   * Filters out SUPER_ADMIN logs unless the actor is SUPER_ADMIN.
   * @param filters - Query filters (page, limit, action, entity_type, search)
   * @param actor - The authenticated user
   */
  static async list(filters: any, actor: any) {
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 25);
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    const userWhere: any = {};

    // Filter out SUPER_ADMIN logs if actor is not SUPER_ADMIN
    if (actor?.role !== 'SUPER_ADMIN') {
      userWhere.role = { [Op.ne]: 'SUPER_ADMIN' };
    }

    // Filter by action type
    if (filters.action) {
      whereClause.action = filters.action;
    }

    // Filter by entity type
    if (filters.entity_type) {
      whereClause.entity_type = filters.entity_type;
    }

    // Search across action and entity_type
    if (filters.search) {
      whereClause[Op.or] = [
        { action: { [Op.iLike]: `%${filters.search}%` } },
        { entity_type: { [Op.iLike]: `%${filters.search}%` } },
        { entity_id: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      success: true,
      data: rows,
      code: 100,
      misc: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  }
}