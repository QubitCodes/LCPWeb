import { User, Company, UserApproval, CompanyDetail, CompanySite } from '../models';
import { comparePassword, generateToken, hashPassword } from '../lib/auth';
import sequelize from '../lib/sequelize';
import { UserRole } from '../models/enums';
import { UserStatus } from '../models/User';
import { ApprovalStatus } from '../models/UserApproval';
import { firebaseAdmin } from '../lib/firebaseAdmin';

export class AuthController {

  /**
   * Step 1 of company registration: Create the ADMIN_SUPERVISOR user.
   * Verifies Firebase OTP token, creates user without password or company.
   * Returns a JWT so the user is auto-logged-in for subsequent steps.
   * @param data - { idToken, first_name, last_name, email, country_code, phone }
   */
  static async registerSupervisor(data: any) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Verify Firebase Token
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(data.idToken);
      const firebasePhone = decodedToken.phone_number;

      if (!firebasePhone) {
        await transaction.rollback();
        return { success: false, message: 'Invalid phone number in token', code: 210 };
      }

      // 2. Check if phone number is already registered
      const existingPhoneUser = await (User as any).findOne({
        where: sequelize.where(
          sequelize.fn('concat', sequelize.col('country_code'), sequelize.col('phone')),
          firebasePhone
        )
      });
      if (existingPhoneUser) {
        await transaction.rollback();
        return { success: false, message: 'This phone number is already registered', code: 205 };
      }

      // 3. Check email uniqueness if provided
      if (data.email) {
        const existingEmailUser = await (User as any).findOne({ where: { email: data.email } });
        if (existingEmailUser) {
          await transaction.rollback();
          return { success: false, message: 'Email already registered', code: 205 };
        }
      }

      // 4. Create ADMIN_SUPERVISOR — no password, no company yet
      const newUser = await (User as any).create({
        email: data.email || null,
        password_hash: null,
        first_name: data.first_name,
        last_name: data.last_name,
        country_code: data.country_code || '+971',
        phone: data.phone,
        role: UserRole.ADMIN_SUPERVISOR,
        status: UserStatus.ACTIVE,
        company_id: null, // No company yet
        years_experience: 0
      }, { transaction });

      await transaction.commit();

      // 5. Auto-login: generate JWT so they can continue onboarding
      const token = await generateToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        company_id: null
      });

      return {
        success: true,
        message: 'Supervisor registered successfully',
        data: {
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role,
            company: null,
            onboarding_step: null // No company yet, frontend should go to Step 2
          }
        },
        code: 101
      };

    } catch (error: any) {
      await transaction.rollback();
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        return { success: false, message: error.errors[0].message, code: 201 };
      }
      console.error('Supervisor Registration Error:', error);
      return { success: false, message: 'Registration failed', code: 300 };
    }
  }

  /**
   * Step 2 of company registration: Create the company and link it to the user.
   * Creates a company_details record with onboarding_step = 2 (needs site next).
   * Requires auth (JWT from Step 1).
   * @param userId - The authenticated ADMIN_SUPERVISOR's user ID
   * @param data - { company_name, industry_id, address, website, contact_email, contact_phone }
   */
  static async onboardCompany(userId: string, data: any) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Verify user exists and is ADMIN_SUPERVISOR
      const user = await (User as any).findByPk(userId);
      if (!user || user.role !== UserRole.ADMIN_SUPERVISOR) {
        await transaction.rollback();
        return { success: false, message: 'Unauthorized', code: 211 };
      }

      // 2. Check if user already has a company
      if (user.company_id) {
        await transaction.rollback();
        return { success: false, message: 'Company already registered for this user', code: 205 };
      }

      // 3. Generate 6-digit Company ID
      const companyId = Math.floor(100000 + Math.random() * 900000).toString();

      // Explicitly generate UUID for the new Company to ensure it's available for CompanyDetail
      const { v4: uuidv4 } = require('uuid');
      const newCompanyUuid = uuidv4();

      // 4. Create Company
      const newCompany = await (Company as any).create({
        id: newCompanyUuid,
        name: data.company_name,
        company_id: companyId,
        industry_id: data.industry_id || null,
        address: data.address || null,
        website: data.website || null,
        contact_email: data.contact_email || user.email,
        contact_phone: data.contact_phone || `${user.country_code}${user.phone}`,
        status: 'PENDING',
        approval_status: 'PENDING'
      }, { transaction });

      // 5. Create CompanyDetail with onboarding_step = 2 (needs site next)
      await (CompanyDetail as any).create({
        company_id: newCompanyUuid,
        onboarding_step: 2
      }, { transaction });

      // 6. Link user to company
      await (User as any).update(
        { company_id: newCompanyUuid },
        { where: { id: userId }, transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: 'Company registered. Please add your first site.',
        data: {
          companyId: newCompany.company_id,
          companyUUID: newCompany.id,
          onboarding_step: 2
        },
        code: 101
      };

    } catch (error: any) {
      await transaction.rollback();
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        return { success: false, message: error.errors[0].message, code: 201 };
      }
      console.error('Company Onboarding Error:', error);
      return { success: false, message: `Debug: ${error.name} - ${error.message}`, code: 300 };
    }
  }

  /**
   * Step 3 of company registration: Add the first site.
   * Creates a CompanySite record and sets onboarding_step = 3 (needs review).
   * Requires auth.
   * @param userId - The authenticated ADMIN_SUPERVISOR's user ID
   * @param data - { site_name, site_address, project_stage, expected_duration_months, contractor_rep_id, site_supervisor_id }
   */
  static async addOnboardingSite(userId: string, data: any) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Get user with company
      const user = await (User as any).findByPk(userId, {
        include: [{ model: Company, as: 'company' }]
      });
      if (!user || !user.company_id) {
        await transaction.rollback();
        return { success: false, message: 'No company found for this user', code: 310 };
      }

      // 2. Validate required fields
      if (!data.site_name?.trim()) {
        await transaction.rollback();
        return { success: false, message: 'Site name is required', code: 202 };
      }

      // 3. Create the site
      const newSite = await (CompanySite as any).create({
        company_id: user.company_id,
        name: data.site_name.trim(),
        address: data.site_address || null,
        project_stage: data.project_stage || null,
        expected_duration_months: data.expected_duration_months || null,
        contractor_rep_id: data.contractor_rep_id || null,
        site_supervisor_id: data.site_supervisor_id || null,
        status: 'ACTIVE'
      }, { transaction });

      // 4. Update onboarding_step to 3 (needs review)
      await (CompanyDetail as any).update(
        { onboarding_step: 3 },
        { where: { company_id: user.company_id }, transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: 'Site added. Please review and complete registration.',
        data: {
          siteId: newSite.id,
          siteName: newSite.name,
          onboarding_step: 3
        },
        code: 101
      };

    } catch (error: any) {
      await transaction.rollback();
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        return { success: false, message: error.errors[0].message, code: 201 };
      }
      console.error('Add Onboarding Site Error:', error);
      return { success: false, message: 'Failed to add site', code: 300 };
    }
  }

  /**
   * Step 4 of company registration: Review & complete onboarding.
   * Sets onboarding_step to NULL (complete).
   * Optionally accepts tax_id if provided.
   * Requires auth.
   * @param userId - The authenticated ADMIN_SUPERVISOR's user ID
   * @param data - { tax_id? }
   */
  static async completeOnboarding(userId: string, data: any) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Get user with company
      const user = await (User as any).findByPk(userId, {
        include: [{ model: Company, as: 'company' }]
      });
      if (!user || !user.company_id) {
        await transaction.rollback();
        return { success: false, message: 'No company found for this user', code: 310 };
      }

      // 2. Update company with optional tax_id
      if (data.tax_id) {
        await (Company as any).update(
          { tax_id: data.tax_id },
          { where: { id: user.company_id }, transaction }
        );
      }

      // 3. Set onboarding_step to NULL (complete)
      await (CompanyDetail as any).update(
        { onboarding_step: null },
        { where: { company_id: user.company_id }, transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: 'Onboarding complete. Your application is pending admin review.',
        data: { onboarding_step: null },
        code: 100
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Complete Onboarding Error:', error);
      return { success: false, message: 'Verification failed', code: 300 };
    }
  }

  /**
   * Standard email/password login.
   * Checks user credentials and generates a JWT token.
   * @param data - Object containing email and password
   */
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

    // 4. Fetch onboarding_step from company_details if user has a company
    let onboardingStep: number | null = null;
    if (user.company_id) {
      const detail = await (CompanyDetail as any).findOne({ where: { company_id: user.company_id } });
      onboardingStep = detail?.onboarding_step ?? null;
    }

    // 5. Return Data
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
          company: (user as any).company,
          onboarding_step: onboardingStep
        }
      }
    };
  }

  /**
   * Login via Firebase phone OTP.
   * Verifies the Firebase ID token, finds the user by phone,
   * checks their approval status, and generates a JWT.
   * @param idToken - Firebase ID token from client-side OTP verification
   */
  static async loginWithPhone(idToken: string) {
    try {
      // 1. Verify Firebase Token
      console.log('[loginWithPhone] Verifying Firebase token...');
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;
      console.log('[loginWithPhone] Firebase phone:', phoneNumber);

      if (!phoneNumber) {
        return { success: false, message: 'Invalid phone number in token', code: 210 };
      }

      // 2. Find User by phone number
      // Try multiple lookup strategies for reliability
      let user: any = null;

      // Strategy A: CONCAT country_code + phone
      try {
        user = await (User as any).findOne({
          where: sequelize.where(
            sequelize.fn('concat', sequelize.col('country_code'), sequelize.col('phone')),
            phoneNumber
          ),
          include: [{ model: Company, as: 'company' }]
        });
      } catch (concatErr) {
        console.warn('[loginWithPhone] CONCAT lookup failed:', concatErr);
      }

      // Strategy B: If CONCAT failed or returned null, try splitting the phone number
      // Firebase returns "+919876543210" — we need to match against country_code="+91" phone="9876543210"
      if (!user) {
        console.log('[loginWithPhone] Trying fallback phone lookup...');
        // Find all users and check if any match
        const allPhoneUsers = await (User as any).findAll({
          where: {
            phone: { [require('sequelize').Op.ne]: null },
            country_code: { [require('sequelize').Op.ne]: null },
          },
          include: [{ model: Company, as: 'company' }]
        });

        user = allPhoneUsers.find((u: any) => {
          const full = `${u.country_code}${u.phone}`;
          return full === phoneNumber;
        });

        if (user) {
          console.log('[loginWithPhone] Found user via fallback:', user.id);
        }
      }

      // 3. If User Not Found -> Return Special Flag for Frontend to Trigger Registration
      if (!user) {
        console.log('[loginWithPhone] No user found for phone:', phoneNumber);
        return {
          success: false,
          message: 'User not found',
          code: 310,
          is_new_user: true,
          phone_number: phoneNumber
        };
      }

      console.log('[loginWithPhone] User found:', user.id, user.first_name, user.status);

      // 4. Check User Status Before Allowing Login
      if (user.status === UserStatus.PENDING) {
        return {
          success: false,
          message: 'Your account is pending approval. Please wait for an admin or supervisor to approve your registration.',
          code: 403
        };
      }

      if (user.status === UserStatus.SUSPENDED) {
        return {
          success: false,
          message: 'Your account has been suspended. Please contact your administrator.',
          code: 403
        };
      }

      // 5. Generate Token (Same as Email Login)
      const token = await generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id
      });

      // Fetch onboarding_step from company_details if user has a company
      let onboardingStep: number | null = null;
      if (user.company_id) {
        const detail = await (CompanyDetail as any).findOne({ where: { company_id: user.company_id } });
        onboardingStep = detail?.onboarding_step ?? null;
      }

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
            company: (user as any).company,
            onboarding_step: onboardingStep
          }
        }
      };

    } catch (error: any) {
      console.error('[loginWithPhone] DETAILED ERROR:', error.message || error);
      console.error('[loginWithPhone] Stack:', error.stack);
      return { success: false, message: 'Authentication failed', code: 210 };
    }
  }

  /**
   * Register a new user via Firebase phone auth.
   * Creates user with 'pending' status and a user_approvals record.
   * User cannot login until approved by admin/supervisor.
   * @param data - Registration data including idToken, first_name, last_name, etc.
   */
  static async registerPhoneUser(data: any) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Verify Firebase Token
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(data.idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        throw new Error('Invalid Token');
      }

      // 2. Check if phone number is already registered
      const existingPhoneUser = await (User as any).findOne({
        where: sequelize.where(
          sequelize.fn('concat', sequelize.col('country_code'), sequelize.col('phone')),
          phoneNumber
        )
      });
      if (existingPhoneUser) {
        await transaction.rollback();
        return { success: false, message: 'This phone number is already registered', code: 205 };
      }

      // 3. Check email uniqueness only if email is provided
      if (data.email) {
        const existingEmailUser = await (User as any).findOne({ where: { email: data.email } });
        if (existingEmailUser) {
          await transaction.rollback();
          return { success: false, message: 'Email already registered', code: 205 };
        }
      }

      // 4. Look up Company by 6-digit company_id code
      const company = await (Company as any).findOne({
        where: { company_id: data.company_id }
      });
      if (!company) {
        await transaction.rollback();
        return { success: false, message: 'Invalid Company ID. Please check and try again.', code: 310 };
      }

      // 5. Determine role (only WORKER or SUPERVISOR allowed for self-registration)
      const allowedRoles = [UserRole.WORKER, UserRole.SUPERVISOR];
      const role = allowedRoles.includes(data.role) ? data.role : UserRole.WORKER;

      // 6. Create User with pending status (no password for OTP-only users)
      const newUser = await (User as any).create({
        email: data.email || null,
        password_hash: null, // OTP-only user, no password
        first_name: data.first_name,
        last_name: data.last_name,
        country_code: data.country_code,
        phone: data.phone,
        role: role,
        status: UserStatus.PENDING,
        company_id: company.id, // Use the actual UUID, not the 6-digit code
        years_experience: 0
      }, { transaction });

      // 7. Create UserApproval record
      await (UserApproval as any).create({
        user_id: newUser.id,
        company_id: company.id,
        status: ApprovalStatus.PENDING,
      }, { transaction });

      await transaction.commit();

      // 8. Do NOT generate token — user must wait for approval
      return {
        success: true,
        message: 'Registration submitted successfully. Your account is pending approval.',
        data: {
          user: {
            id: newUser.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role,
            status: newUser.status,
            company_id: company.company_id // Return the 6-digit code
          }
        }
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Phone Registration Error:', error);
      return { success: false, message: 'Registration failed', code: 300 };
    }
  }

  /**
   * Check if a user exists by phone number.
   * Returns minimal user data if found (for the OTP login flow).
   * @param phone - The phone number to search for (without country code)
   * @param countryCode - Optional country code, defaults to +971
   */
  static async checkUser(phone: string, countryCode?: string) {
    try {
      // Build where clause: search by phone only
      // Phone is unique enough within the system
      const user = await (User as any).findOne({
        where: { phone },
        attributes: ['id', 'first_name', 'last_name', 'role', 'status', 'country_code', 'phone', 'company_id'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'company_id']
        }]
      });

      if (user) {
        let onboarding_step: number | null = null;
        if (user.company_id) {
          const detail = await (CompanyDetail as any).findOne({ where: { company_id: user.company_id } });
          onboarding_step = detail?.onboarding_step ?? null;
        } else if (user.role === 'ADMIN_SUPERVISOR') {
          onboarding_step = 1;
        }

        return {
          success: true,
          exists: true,
          data: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            status: user.status,
            country_code: user.country_code,
            phone: user.phone,
            full_phone: `${user.country_code}${user.phone}`,
            onboarding_step: onboarding_step,
            company: (user as any).company ? {
              id: (user as any).company.id,
              name: (user as any).company.name,
              company_id: (user as any).company.company_id
            } : null
          }
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

  /**
   * Check if a user exists by email address.
   * Returns minimal user data if found.
   * @param email - The email address to search for
   */
  static async checkUserByEmail(email: string) {
    try {
      const user = await (User as any).findOne({
        where: { email },
        attributes: ['id', 'first_name', 'last_name', 'role', 'status', 'email', 'company_id'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'company_id']
        }]
      });

      if (user) {
        let onboarding_step: number | null = null;
        if (user.company_id) {
          const detail = await (CompanyDetail as any).findOne({ where: { company_id: user.company_id } });
          onboarding_step = detail?.onboarding_step ?? null;
        } else if (user.role === 'ADMIN_SUPERVISOR') {
          onboarding_step = 1;
        }

        return {
          success: true,
          exists: true,
          data: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            status: user.status,
            email: user.email,
            onboarding_step: onboarding_step,
            company: (user as any).company ? {
              id: (user as any).company.id,
              name: (user as any).company.name,
              company_id: (user as any).company.company_id
            } : null
          }
        };
      } else {
        return {
          success: true,
          exists: false
        };
      }
    } catch (error) {
      console.error('Check User By Email Error:', error);
      return { success: false, message: 'Check failed', code: 300 };
    }
  }
}