import { User, Company } from '../models';
import { comparePassword, generateToken, hashPassword } from '../lib/auth';
import sequelize from '../lib/sequelize';
import { UserRole } from '../models/enums';
import { firebaseAdmin } from '../lib/firebaseAdmin';

export class AuthController {

  static async registerCompany(data: any) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validate Email Uniqueness
      const existingUser = await (User as any).findOne({ where: { email: data.supervisor_email } });
      if (existingUser) {
        await transaction.rollback();
        return { success: false, message: 'Email already registered', code: 205 };
      }

      // 2. Generate Company ID (6 digits)
      // Simple generation: Date + Random, ensuring 6 digits. 
      // For higher collision resistance in production, checks are needed.
      const companyId = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Create Company
      const newCompany = await (Company as any).create({
        name: data.company_name,
        company_id: companyId,
        industry_id: data.industry_id,
        address: data.address,
        website: data.website,
        status: 'PENDING',
        approval_status: 'PENDING'
      }, { transaction });

      // 4. Create Supervisor User
      const passwordHash = await hashPassword(data.supervisor_password);
      const newUser = await (User as any).create({
        email: data.supervisor_email,
        password_hash: passwordHash,
        first_name: data.supervisor_first_name,
        last_name: data.supervisor_last_name,
        country_code: data.supervisor_country_code || '+971',
        phone: data.supervisor_phone,
        role: UserRole.SUPERVISOR,
        company_id: newCompany.id,
        years_experience: 0 // Default
      }, { transaction });

      await transaction.commit();

      // 5. Generate Token (Optional: Auto-login)
      // For now, require approval or email verification? 
      // Requirement says: "Company Approval: By Platform Admin".
      // So no token generated for login yet. User must wait.

      return {
        success: true,
        message: 'Registration successful. Application pending approval.',
        data: { companyId: newCompany.company_id },
        code: 101
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Company Registration Error:', error);
      return { success: false, message: 'Registration failed', code: 300 };
    }
  }

  static async login(data: any) {
    const { email, password } = data;

    // 1. Find User
    const user = await (User as any).findOne({
      where: { email },
      include: [{ model: Company, as: 'company' }]
    });

    if (!user) {
      return { success: false, message: 'Invalid credentials', code: 210 };
    }

    // 2. Check Password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials', code: 210 };
    }

    // 3. Generate Token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    });

    // 4. Return Data
    return {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          company: (user as any).company
        }
      }
    };
  }

  static async loginWithPhone(idToken: string) {
    try {
      // 1. Verify Firebase Token
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        return { success: false, message: 'Invalid phone number in token', code: 210 };
      }

      // 2. Find User (Match full phone number by checking if country_code + phone matches, or store full)
      // Since we split it, we need to match carefully. 
      // Assumption: firebase phone number starts with country code.
      // We will try to find a user where `country_code` + `phone` equals `phoneNumber`?
      // OR better: we stored them separately. 
      // Let's assume we can query `where: { phone: phoneNumber }` is wrong because phoneNumber has country code.

      // We need to parse the firebase phoneNumber (e.g. +919400...)
      // Simple strategy without lib: 
      // Try to find a user where regex match or similar?
      // Or just load all users with that `phone` suffix? No.

      // Let's use a raw query or Sequelize operator?
      // For now, let's try to match strict if we know the country code. 
      // But we don't know the country code split from the token string easily without a lib.

      // HACK: For now, I will search by `phone` if I can extract it? No.
      // OPTION: We will use a database function or store `full_phone` virtually?
      // Let's standardise: We will try to match based on the last 10 digits? Risky.

      // Updated Approach: valid user will have `country_code` and `phone`.
      // `phoneNumber` from firebase = "+919400143527"
      // We check if `phoneNumber` ends with `phone` AND starts with `country_code`.

      // Since specific SQL is hard in strict ORM without raw, let's try finding by the substring
      // length is variable. 

      // ALTERNATIVE: Use a raw query to concat.
      const user = await (User as any).findOne({
        where: sequelize.where(
          sequelize.fn('concat', sequelize.col('country_code'), sequelize.col('phone')),
          phoneNumber
        ),
        include: [{ model: Company, as: 'company' }]
      });

      // 3. If User Not Found -> Return Special Flag for Frontend to Trigger Registration
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          code: 310, // RESOURCE_NOT_FOUND (using this to signal frontend)
          is_new_user: true,
          phone_number: phoneNumber
        };
      }

      // 4. Generate Token (Same as Email Login)
      const token = await generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            company: (user as any).company
          }
        }
      };

    } catch (error) {
      console.error('Phone Login Error:', error);
      return { success: false, message: 'Authentication failed', code: 210 };
    }
  }

  static async registerPhoneUser(data: any) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Verify Token Again
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(data.idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        throw new Error('Invalid Token');
      }

      // 2. Check overlap
      const existingUser = await (User as any).findOne({ where: { email: data.email } }, { transaction });
      if (existingUser) {
        await transaction.rollback();
        return { success: false, message: 'Email already registered', code: 205 };
      }

      let companyId = data.company_id;

      // 3. Handle Company (Create or Link)
      if (data.role === UserRole.SUPERVISOR && data.company_name) {
        // Create new company
        const newCompanyId = Math.floor(100000 + Math.random() * 900000).toString();
        const newCompany = await (Company as any).create({
          name: data.company_name,
          company_id: newCompanyId,
          status: 'PENDING',
          approval_status: 'PENDING'
        }, { transaction });
        companyId = newCompany.id;
      }

      // 4. Create User
      // Note: Random password hash since they use phone login. 
      // User can reset password later if they want email login.
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await hashPassword(randomPassword);

      const newUser = await (User as any).create({
        email: data.email,
        password_hash: passwordHash,
        first_name: data.first_name,
        last_name: data.last_name,
        country_code: data.country_code, // From Frontend
        phone: data.phone,               // From Frontend
        role: data.role,
        company_id: companyId,
        years_experience: 0
      }, { transaction });

      await transaction.commit();

      // 5. Generate Token
      const token = await generateToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        company_id: newUser.company_id
      });

      return {
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role,
            company_id: newUser.company_id
          }
        }
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Phone Registration Error:', error);
      return { success: false, message: 'Registration failed', code: 300 };
    }
  }
  static async checkUser(phone: string) {
    try {
      const user = await (User as any).findOne({
        where: { phone },
        attributes: ['id', 'first_name', 'last_name', 'role', 'country_code', 'phone']
      });

      if (user) {
        return {
          success: true,
          exists: true,
          data: user
        };
      } else {
        return {
          success: true,
          exists: false
        };
      }
    } catch (error) {
      console.error('Check User Error:', error);
      return { success: false, message: 'Check failed', code: 300 };
    }
  }
}