import { Industry, Category, Skill, IndustryProjectStage } from '../models';
import { AuditService } from '../services/AuditService';

/**
 * Interface mapping for reference models
 */
const modelMap: { [key: string]: any } = {
  industries: Industry,
  categories: Category,
  project_stages: IndustryProjectStage,
  skills: Skill,
};

export class ReferenceController {
  /**
   * List reference data items
   */
  static async list(type: string, filters: any = {}) {
    const Model = modelMap[type];
    if (!Model) {
      return { success: false, message: 'Invalid reference type', code: 201 };
    }

    const where: any = {};
    if (['categories', 'project_stages'].includes(type) && filters.industry_id) {
        where.industry_id = filters.industry_id;
    }

    let include: any;
    if (type === 'industries') {
      include = ['categories', 'project_stages'];
    } else if (['categories', 'project_stages'].includes(type)) {
      include = ['industry'];
    }

    const items = await Model.findAll({
      where,
      order: [['name', 'ASC']],
      include,
    });

    return { success: true, data: items, code: 100 };
  }

  /**
   * Create a new reference data item
   */
  static async create(type: string, data: any, actorId: string, ip: string) {
    const Model = modelMap[type];
    if (!Model) {
      return { success: false, message: 'Invalid reference type', code: 201 };
    }

    if (['categories', 'project_stages'].includes(type) && !data.industry_id) {
      return { success: false, message: `Industry is required for ${type}`, code: 202 };
    }

    const payload: any = {
      name: data.name,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };
    if (['categories', 'project_stages'].includes(type) && data.industry_id !== undefined) {
      payload.industry_id = data.industry_id || null;
    }

    const newItem = await Model.create(payload);

    await AuditService.log({
      userId: actorId,
      action: `CREATE_${type.toUpperCase().slice(0, -1)}`,
      entityType: type.toUpperCase().slice(0, -1),
      entityId: newItem.id,
      details: { name: newItem.name },
      ipAddress: ip,
    });

    return { success: true, message: 'Item created successfully', data: newItem, code: 101 };
  }

  /**
   * Update an existing reference data item
   */
  static async update(type: string, id: string, data: any, actorId: string, ip: string) {
    const Model = modelMap[type];
    if (!Model) {
      return { success: false, message: 'Invalid reference type', code: 201 };
    }

    const item = await Model.findByPk(id);
    if (!item) {
      return { success: false, message: 'Item not found', code: 310 };
    }

    if (['categories', 'project_stages'].includes(type) && !data.industry_id) {
      return { success: false, message: `Industry is required for ${type}`, code: 202 };
    }

    const oldData = { ...item.toJSON() };
    const payload: any = {
      name: data.name !== undefined ? data.name : item.name,
      is_active: data.is_active !== undefined ? data.is_active : item.is_active,
    };
    if (['categories', 'project_stages'].includes(type) && data.industry_id !== undefined) {
      payload.industry_id = data.industry_id || null;
    }

    await item.update(payload);

    await AuditService.log({
      userId: actorId,
      action: `UPDATE_${type.toUpperCase().slice(0, -1)}`,
      entityType: type.toUpperCase().slice(0, -1),
      entityId: item.id,
      details: { oldData, newData: item.toJSON() },
      ipAddress: ip,
    });

    return { success: true, message: 'Item updated successfully', data: item, code: 103 };
  }

  /**
   * Delete a reference data item (soft delete if supported)
   */
  static async delete(type: string, id: string, actorId: string, ip: string) {
    const Model = modelMap[type];
    if (!Model) {
      return { success: false, message: 'Invalid reference type', code: 201 };
    }

    const item = await Model.findByPk(id);
    if (!item) {
      return { success: false, message: 'Item not found', code: 310 };
    }

    await item.destroy();

    await AuditService.log({
      userId: actorId,
      action: `DELETE_${type.toUpperCase().slice(0, -1)}`,
      entityType: type.toUpperCase().slice(0, -1),
      entityId: id,
      details: { name: item.name },
      ipAddress: ip,
    });

    return { success: true, message: 'Item deleted successfully', code: 103 };
  }
}
