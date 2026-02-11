import { Industry, Category, Skill } from '../models';
import { AuditService } from '../services/AuditService';

/**
 * Interface mapping for reference models
 */
const modelMap: { [key: string]: any } = {
  industries: Industry,
  categories: Category,
  skills: Skill,
};

export class ReferenceController {
  /**
   * List reference data items
   */
  static async list(type: string) {
    const Model = modelMap[type];
    if (!Model) {
      return { success: false, message: 'Invalid reference type', code: 201 };
    }

    const items = await Model.findAll({
      order: [['name', 'ASC']],
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

    const newItem = await Model.create({
      name: data.name,
      is_active: data.is_active !== undefined ? data.is_active : true,
    });

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

    const oldData = { ...item.toJSON() };
    await item.update({
      name: data.name !== undefined ? data.name : item.name,
      is_active: data.is_active !== undefined ? data.is_active : item.is_active,
    });

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
