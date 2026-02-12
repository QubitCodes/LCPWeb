import { User, Company, CompanyMembershipHistory } from '../models';
import { hashPassword } from '../lib/auth';
import { AuditService } from '../services/AuditService';
import { Op } from 'sequelize';
import sequelize from '../lib/sequelize';

export class UserController {

  static async list(query: any, actor: any) {
    const { role, company_id } = query;
    const whereClause: any = {};

    // Role Filtering & Security
    if (actor?.role !== 'SUPER_ADMIN') {
      if (role) {
        if (role === 'SUPER_ADMIN') {
          // Hide SUPER_ADMIN from non-super admins
          return { success: true, data: [], code: 100 };
        }
        whereClause.role = role;
      } else {
        // Exclude SUPER_ADMIN from list
        whereClause.role = { [Op.ne]: 'SUPER_ADMIN' };
      }
    } else {
      // Super Admin can filter by any role or see all
      if (role) whereClause.role = role;
    }

    const users = await (User as any).findAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name']
        }
      ],
      attributes: { exclude: ['password_hash', 'deleted_at'] },
      order: [['created_at', 'DESC']]
    });

    return { success: true, data: users, code: 100 };
  }

  static async create(data: any, actorId: string, ip: string) {
    // 1. Check if email exists
    const existingUser = await (User as any).findOne({ where: { email: data.email } });
    if (existingUser) {
      return { success: false, message: 'Email already exists', code: 205 };
    }

    // 2. Hash Password
    const hashedPassword = await hashPassword(data.password);

    // 3. Create User
    const newUser = await (User as any).create({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password_hash: hashedPassword,
      role: data.role,
      company_id: data.company_id || null,
      phone_number: data.phone_number,
      years_experience: data.years_experience || 0
    });

    // 4. Log Action
    await AuditService.log({
      userId: actorId,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: newUser.id,
      details: {
        role: newUser.role,
        email: newUser.email,
        company_id: newUser.company_id
      },
      ipAddress: ip
    });

    // Remove hash from return
    const userResponse = newUser.toJSON();
    delete (userResponse as any).password_hash;

    return { success: true, message: 'User created successfully', data: userResponse, code: 101 };
  }

  static async changeCompany(userId: string, newCompanyId: string, reason: string, actorId: string) {
    const t = await sequelize.transaction();
    try {
      const user = await (User as any).findByPk(userId);
      if (!user) throw new Error('User not found');

      const oldCompanyId = user.company_id;

      // If no change, return
      if (oldCompanyId === newCompanyId) return { success: true, message: 'Same company', code: 100 };

      // Update User
      await user.update({ company_id: newCompanyId }, { transaction: t });

      // Create History Record
      await (CompanyMembershipHistory as any).create({
        user_id: userId,
        from_company_id: oldCompanyId,
        to_company_id: newCompanyId,
        effective_date: new Date(),
        initiated_by_user_id: actorId,
        reason: reason
      }, { transaction: t });

      await t.commit();
      return { success: true, message: 'Company updated', code: 103 };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async update(id: string, data: any, actor: any) {
    try {
      const user = await (User as any).findByPk(id);
      if (!user) {
        return { success: false, message: 'User not found', code: 310 };
      }

      // Security check: Only Admin or Self can update? 
      // Assuming Admin can update anyone.

      const updateData: any = {};
      if (data.first_name) updateData.first_name = data.first_name;
      if (data.last_name) updateData.last_name = data.last_name;
      if (data.email) updateData.email = data.email; // Should check uniqueness if changed
      if (data.role) updateData.role = data.role;
      if (data.phone_number) updateData.phone_number = data.phone_number;

      await user.update(updateData);

      // Log
      await AuditService.log({
        userId: actor.id,
        action: 'UPDATE_USER',
        entityType: 'USER',
        entityId: user.id,
        details: updateData, // Log what changed
        ipAddress: '0.0.0.0'
      });

      // Return clean user
      const userResponse = user.toJSON();
      delete (userResponse as any).password_hash;

      return { success: true, message: 'User updated', data: userResponse, code: 103 };

    } catch (error: any) {
      console.error('Update User Error:', error);
      return { success: false, message: error.message, code: 300 };
    }
  }
}