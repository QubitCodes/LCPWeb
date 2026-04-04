import { User, Company, CompanyMembershipHistory } from '../models';
import { hashPassword } from '../lib/auth';
import { AuditService } from '../services/AuditService';
import { Op } from 'sequelize';
import sequelize from '../lib/sequelize';
import { firebaseAdmin } from '../lib/firebaseAdmin';

export class UserController {

  static async list(query: any, actor: any) {
    let { role, company_id, type } = query;
    const whereClause: any = {};

    if (company_id) {
      whereClause.company_id = company_id;
    }

    // Dynamic grouping based on type parameter
    if (type === 'admins' && !role) {
      role = 'SUPER_ADMIN,ADMIN';
    }

    // Role Filtering & Security
    if (actor?.role !== 'SUPER_ADMIN') {
      if (role) {
        if (typeof role === 'string' && role.includes(',')) {
          // If multiple roles requested, filter out SUPER_ADMIN
          const safeRoles = role.split(',').filter((r: string) => r.trim() !== 'SUPER_ADMIN');
          whereClause.role = { [Op.in]: safeRoles };
        } else {
          if (role === 'SUPER_ADMIN') {
            // Hide SUPER_ADMIN from non-super admins
            return { success: true, data: [], code: 100 };
          }
          whereClause.role = role;
        }
      } else {
        // Exclude SUPER_ADMIN from list
        whereClause.role = { [Op.ne]: 'SUPER_ADMIN' };
      }
    } else {
      // Super Admin can filter by any role, multiple roles, or see all
      if (role) {
        if (typeof role === 'string' && role.includes(',')) {
          whereClause.role = { [Op.in]: role.split(',').map((r: string) => r.trim()) };
        } else {
          whereClause.role = role;
        }
      }
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
    // 1. Check if email exists (only if provided)
    if (data.email) {
      const existingEmailUser = await (User as any).findOne({ where: { email: data.email } });
      if (existingEmailUser) {
        return { success: false, message: 'Email already exists', code: 205 };
      }
    }

    // Check if phone exists locally
    const existingPhoneUser = await (User as any).findOne({ where: { phone: data.phone } });
    if (existingPhoneUser) {
      return { success: false, message: 'Phone number already registered locally', code: 205 };
    }

    let firebaseUid = null;
    const fullPhone = `${data.country_code}${data.phone}`;

    // 2. Either Verify OTP (idToken) OR Auto-Create in Firebase
    if (data.idToken) {
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(data.idToken);
        firebaseUid = decodedToken.uid;
        
        // Optional: Ensure the decoded phone number matches what we expect
        if (decodedToken.phone_number !== fullPhone) {
           return { success: false, message: 'OTP phone number does not match submitted phone number', code: 400 };
        }
      } catch (err: any) {
        return { success: false, message: 'Invalid or expired OTP token', code: 401 };
      }
    } else {
      try {
        const userRecord = await firebaseAdmin.auth().createUser({
          phoneNumber: fullPhone,
          displayName: `${data.first_name} ${data.last_name}`,
        });
        firebaseUid = userRecord.uid;
      } catch (err: any) {
        if (err.code === 'auth/phone-number-already-exists') {
          return { success: false, message: 'This phone number is already registered in Firebase. Registration rejected.', code: 205 };
        }
        return { success: false, message: `Firebase Error: ${err.message}`, code: 300 };
      }
    }

    // 3. Create User in PostgreSQL
    let newUser;
    try {
      newUser = await (User as any).create({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        role: data.role,
        company_id: data.company_id || null,
        phone: data.phone,
        country_code: data.country_code,
        firebase_uid: firebaseUid,
        status: 'ACTIVE', // Ensure active status if manually created by admins
        years_experience: data.years_experience || 0
      });
    } catch (dbError: any) {
      // Rollback Firebase user if DB fails (only if we created it dynamically)
      if (firebaseUid && !data.idToken) {
        await firebaseAdmin.auth().deleteUser(firebaseUid).catch(console.error);
      }
      return { success: false, message: 'Database Error: ' + dbError.message, code: 301 };
    }

    // 4. Log Action
    await AuditService.log({
      userId: actorId,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: newUser.id,
      details: {
        role: newUser.role,
        phone: newUser.phone,
        company_id: newUser.company_id
      },
      ipAddress: ip
    });

    const userResponse = newUser.toJSON();
    

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
      if (data.status) updateData.status = data.status;
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

  static async getById(id: string, actor: any) {
    try {
      const user = await (User as any).findByPk(id, {
        include: [
          {
            model: Company,
            as: 'company',
            attributes: ['id', 'name']
          }
        ],
        attributes: { exclude: ['password_hash', 'deleted_at'] }
      });

      if (!user) {
        return { success: false, message: 'User not found', code: 310 };
      }

      return { success: true, data: user, code: 100 };
    } catch (error: any) {
      console.error('Get User Error:', error);
      return { success: false, message: error.message, code: 300 };
    }
  }

  static async delete(id: string, actor: any) {
    try {
      const user = await (User as any).findByPk(id);
      if (!user) {
        return { success: false, message: 'User not found', code: 310 };
      }

      // Check if trying to delete self
      if (user.id === actor?.id) {
        return { success: false, message: 'Cannot delete yourself', code: 400 };
      }

      // Instead of an actual DB delete, apply a soft delete based on instructions
      await user.update({
        deleted_at: new Date(),
        delete_reason: 'Deleted by Admin'
      });

      // Log action
      await AuditService.log({
        userId: actor?.id || 'system',
        action: 'DELETE_USER',
        entityType: 'USER',
        entityId: id,
        details: { role: user.role, email: user.email },
        ipAddress: '0.0.0.0'
      });

      return { success: true, message: 'User deleted successfully', code: 100 };
    } catch (error: any) {
      console.error('Delete User Error:', error);
      return { success: false, message: error.message, code: 300 };
    }
  }
}