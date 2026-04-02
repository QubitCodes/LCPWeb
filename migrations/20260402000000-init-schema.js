'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // -----------------------------------------------------------------------
  // TABLE: ref_industries
  // DESCRIPTION: Lookup table for diverse industries (e.g. Construction, Hospitality).
  // -----------------------------------------------------------------------
  await queryInterface.createTable('ref_industries', {
    id: {
      type: Sequelize.literal('INTEGER'),
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
      unique: true,
    },
    is_active: {
      type: Sequelize.literal('BOOLEAN'),
      defaultValue: true,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: companies
  // DESCRIPTION: Core table storing company/tenant details.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('companies', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    company_id: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
      unique: true,
    },
    industry_id: {
      type: Sequelize.literal('INTEGER'),
      references: {
        model: 'ref_industries',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    tax_id: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    address: {
      type: Sequelize.literal('TEXT'),
    },
    website: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    contact_email: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    contact_phone: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    status: {
      type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'PENDING'),
      defaultValue: 'PENDING',
    },
    approval_status: {
      type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    documents: {
      type: Sequelize.literal('JSON'),
      defaultValue: [],
    },
    is_onboarding_completed: {
      type: Sequelize.literal('BOOLEAN'),
      allowNull: false,
      defaultValue: false,
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: users
  // DESCRIPTION: Core table for all users (workers, admins, supervisors).
  // -----------------------------------------------------------------------
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    email: {
      type: Sequelize.literal('VARCHAR(255)'),
      unique: true,
    },
    firebase_uid: {
      type: Sequelize.literal('VARCHAR(255)'),
      unique: true,
    },
    first_name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    last_name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    role: {
      type: Sequelize.ENUM('SUPER_ADMIN', 'ADMIN', 'ADMIN_SUPERVISOR', 'SUPERVISOR', 'WORKER'),
      allowNull: false,
      defaultValue: 'WORKER',
    },
    status: {
      type: Sequelize.ENUM('ACTIVE', 'PENDING', 'SUSPENDED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    country_code: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: '+971',
    },
    phone: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
      unique: true,
    },
    company_id: {
      type: Sequelize.literal('UUID'),
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    years_experience: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: 0,
    },
    documents: {
      type: Sequelize.literal('JSON'),
      defaultValue: [],
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: ref_categories
  // DESCRIPTION: Categories associated with specific industries.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('ref_categories', {
    id: {
      type: Sequelize.literal('INTEGER'),
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    industry_id: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      references: {
        model: 'ref_industries',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    description: {
      type: Sequelize.literal('TEXT'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: ref_jobs
  // DESCRIPTION: Specific job roles falling under categories.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('ref_jobs', {
    id: {
      type: Sequelize.literal('INTEGER'),
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    category_id: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      references: {
        model: 'ref_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: courses
  // DESCRIPTION: Courses mapped to job roles.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('courses', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    job_id: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      references: {
        model: 'ref_jobs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    title: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    description: {
      type: Sequelize.literal('TEXT'),
    },
    is_active: {
      type: Sequelize.literal('BOOLEAN'),
      defaultValue: true,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: course_levels
  // DESCRIPTION: Levels within a course (e.g., beginner, intermediate).
  // -----------------------------------------------------------------------
  await queryInterface.createTable('course_levels', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    course_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    level_number: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
    },
    title: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    description: {
      type: Sequelize.literal('TEXT'),
    },
    fast_track_experience_required: {
      type: Sequelize.literal('INTEGER'),
    },
    completion_window_days: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      defaultValue: 30,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: content_items
  // DESCRIPTION: Individual learning materials (videos, quizzes) for a course level.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('content_items', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    course_level_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'course_levels',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    title: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    type: {
      type: Sequelize.ENUM('VIDEO', 'QUESTIONNAIRE'),
      allowNull: false,
    },
    sequence_order: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
    },
    video_url: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    video_duration_seconds: {
      type: Sequelize.literal('INTEGER'),
    },
    min_watch_percentage: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: 90,
    },
    is_eligibility_check: {
      type: Sequelize.literal('BOOLEAN'),
      defaultValue: false,
    },
    is_final_exam: {
      type: Sequelize.literal('BOOLEAN'),
      defaultValue: false,
    },
    passing_score: {
      type: Sequelize.literal('INTEGER'),
    },
    retry_threshold: {
      type: Sequelize.literal('INTEGER'),
    },
    max_attempts_allowed: {
      type: Sequelize.literal('INTEGER'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: audit_logs
  // DESCRIPTION: System audit trail for tracking user actions and changes.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('audit_logs', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    user_id: {
      type: Sequelize.literal('UUID'),
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    action: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    entity_type: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    entity_id: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    details: {
      type: Sequelize.literal('JSON'),
    },
    ip_address: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: ref_skills
  // DESCRIPTION: Lookup table for individual skills.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('ref_skills', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: ref_job_skills
  // DESCRIPTION: Mapping table establishing which skills belong to which jobs.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('ref_job_skills', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    job_id: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      unique: true,
      references: {
        model: 'ref_jobs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    skill_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      unique: true,
      references: {
        model: 'ref_skills',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    difficulty_level: {
      type: Sequelize.ENUM('BASIC', 'INTERMEDIATE', 'ADVANCED'),
      allowNull: false,
      defaultValue: 'BASIC',
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: orders
  // DESCRIPTION: E-commerce orders placed by users or companies.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('orders', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    user_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    company_id: {
      type: Sequelize.literal('UUID'),
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    total_amount: {
      type: Sequelize.literal('DECIMAL(10,2)'),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: Sequelize.literal('VARCHAR(3)'),
      defaultValue: 'USD',
    },
    status: {
      type: Sequelize.ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: order_items
  // DESCRIPTION: Line items representing course purchases within an order.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('order_items', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    order_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    worker_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    course_level_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'course_levels',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    price: {
      type: Sequelize.literal('DECIMAL(10,2)'),
      allowNull: false,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: payments
  // DESCRIPTION: Payment transaction records linked to orders.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('payments', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    order_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    provider: {
      type: Sequelize.ENUM('STRIPE', 'MANUAL'),
      allowNull: false,
    },
    provider_transaction_id: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    amount: {
      type: Sequelize.literal('DECIMAL(10,2)'),
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    proof_document_url: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: level_enrollments
  // DESCRIPTION: Tracks worker enrollments into specific course levels.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('level_enrollments', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    worker_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    course_level_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'course_levels',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    start_date: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deadline_date: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'FAILED', 'EXPIRED'),
      defaultValue: 'ACTIVE',
    },
    completion_date: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: content_progress
  // DESCRIPTION: Tracks worker progress and completion of individual content items.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('content_progress', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    worker_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
    },
    enrollment_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'level_enrollments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    content_item_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'content_items',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    status: {
      type: Sequelize.ENUM('LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'),
      defaultValue: 'LOCKED',
    },
    watch_percentage: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: 0,
    },
    quiz_score: {
      type: Sequelize.literal('INTEGER'),
    },
    attempts_count: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: 0,
    },
    last_accessed_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      defaultValue: Sequelize.fn('now'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: questions
  // DESCRIPTION: Quiz questions associated with content items.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('questions', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    content_item_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'content_items',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    text: {
      type: Sequelize.literal('TEXT'),
      allowNull: false,
    },
    type: {
      type: Sequelize.ENUM('MCQ', 'TEXT'),
      defaultValue: 'MCQ',
    },
    points: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: 1,
    },
    sequence_order: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: 0,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: question_options
  // DESCRIPTION: Multiple-choice options for a specific question.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('question_options', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    question_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    text: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    is_correct: {
      type: Sequelize.literal('BOOLEAN'),
      defaultValue: false,
    },
    order: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: 0,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: level_recommendations
  // DESCRIPTION: System or admin recommendations for workers to take specific levels.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('level_recommendations', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    worker_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    company_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    course_level_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'course_levels',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    recommended_by_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    reason: {
      type: Sequelize.literal('TEXT'),
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    admin_comment: {
      type: Sequelize.literal('TEXT'),
    },
    approved_by_admin_id: {
      type: Sequelize.literal('UUID'),
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: certificates
  // DESCRIPTION: Issued certificates upon completion of course levels.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('certificates', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    worker_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    enrollment_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      unique: true,
      references: {
        model: 'level_enrollments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    course_level_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'course_levels',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    certificate_code: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
      unique: true,
    },
    issue_date: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    pdf_url: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: company_membership_history
  // DESCRIPTION: Historical tracking of a user moving between different companies.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('company_membership_history', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    user_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    from_company_id: {
      type: Sequelize.literal('UUID'),
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    to_company_id: {
      type: Sequelize.literal('UUID'),
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    effective_date: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      defaultValue: Sequelize.fn('now'),
    },
    initiated_by_user_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    reason: {
      type: Sequelize.literal('TEXT'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: user_approvals
  // DESCRIPTION: Workflow requests for user onboarding and approvals.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('user_approvals', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    user_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    company_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved_initial', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    approved_by: {
      type: Sequelize.literal('UUID'),
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    approved_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
    comments: {
      type: Sequelize.literal('TEXT'),
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: company_details
  // DESCRIPTION: Extension table for additional onboarding data of a company.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('company_details', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    company_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      unique: true,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    onboarding_step: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: 1,
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: company_sites
  // DESCRIPTION: Physical operational sites or branches belonging to a company.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('company_sites', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    company_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    address: {
      type: Sequelize.literal('TEXT'),
    },
    project_stage: {
      type: Sequelize.ENUM('FOUNDATION', 'STRUCTURE', 'MASONRY', 'FINISHING', 'MEP'),
      defaultValue: null,
    },
    expected_duration_months: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: null,
    },
    contractor_rep_id: {
      type: Sequelize.literal('UUID'),
      defaultValue: null,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    site_supervisor_id: {
      type: Sequelize.literal('UUID'),
      defaultValue: null,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    status: {
      type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: survey_templates
  // DESCRIPTION: Configurable templates for safety or compliance surveys.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('survey_templates', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    slug: {
      type: Sequelize.literal('VARCHAR(100)'),
      unique: true,
    },
    description: {
      type: Sequelize.literal('TEXT'),
      defaultValue: null,
    },
    industry_id: {
      type: Sequelize.literal('INTEGER'),
      defaultValue: null,
      references: {
        model: 'ref_industries',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    type: {
      type: Sequelize.ENUM('SURVEY', 'QUIZ', 'ONBOARDING'),
      allowNull: false,
      defaultValue: 'SURVEY',
    },
    status: {
      type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'DRAFT'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    is_system: {
      type: Sequelize.literal('BOOLEAN'),
      allowNull: false,
      defaultValue: false,
    },
    created_by: {
      type: Sequelize.literal('UUID'),
      defaultValue: null,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: null,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: survey_sections
  // DESCRIPTION: Logical sections dividing a survey template.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('survey_sections', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    template_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'survey_templates',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    description: {
      type: Sequelize.literal('TEXT'),
      defaultValue: null,
    },
    sequence_order: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      defaultValue: 0,
    },
    is_wizard_step: {
      type: Sequelize.literal('BOOLEAN'),
      allowNull: false,
      defaultValue: false,
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: null,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: survey_questions
  // DESCRIPTION: Dynamic questions defined within survey sections.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('survey_questions', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    section_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'survey_sections',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    text: {
      type: Sequelize.literal('TEXT'),
      allowNull: false,
    },
    type: {
      type: Sequelize.ENUM('TEXT', 'NUMBER', 'DECIMAL', 'YES_NO', 'SELECT', 'MULTI_SELECT', 'DATE', 'FILE_UPLOAD', 'USER_SELECT', 'DATA_SELECT'),
      allowNull: false,
      defaultValue: 'TEXT',
    },
    is_required: {
      type: Sequelize.literal('BOOLEAN'),
      allowNull: false,
      defaultValue: false,
    },
    sequence_order: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      defaultValue: 0,
    },
    points: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      defaultValue: 0,
    },
    config: {
      type: Sequelize.literal('JSON'),
      defaultValue: null,
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: null,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: survey_question_options
  // DESCRIPTION: Choice options for select-type survey questions.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('survey_question_options', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    question_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'survey_questions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    text: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    value: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    is_correct: {
      type: Sequelize.literal('BOOLEAN'),
      allowNull: false,
      defaultValue: false,
    },
    sequence_order: {
      type: Sequelize.literal('INTEGER'),
      allowNull: false,
      defaultValue: 0,
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: null,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: survey_responses
  // DESCRIPTION: Master record of a submitted survey by a user or company.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('survey_responses', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    template_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'survey_templates',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    site_id: {
      type: Sequelize.literal('UUID'),
      defaultValue: null,
      references: {
        model: 'company_sites',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    company_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    respondent_id: {
      type: Sequelize.literal('UUID'),
      defaultValue: null,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    status: {
      type: Sequelize.ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    completed_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      defaultValue: null,
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: null,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: survey_answers
  // DESCRIPTION: Individual answers given to survey questions in a response.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('survey_answers', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    response_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'survey_responses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    question_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'survey_questions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    },
    answer_text: {
      type: Sequelize.literal('TEXT'),
      defaultValue: null,
    },
    answer_json: {
      type: Sequelize.literal('JSON'),
      defaultValue: null,
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: null,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: survey_signoffs
  // DESCRIPTION: Digital signatures and sign-offs for finalized survey responses.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('survey_signoffs', {
    id: {
      type: Sequelize.literal('UUID'),
      primaryKey: true,
      defaultValue: {},
    },
    response_id: {
      type: Sequelize.literal('UUID'),
      allowNull: false,
      references: {
        model: 'survey_responses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: Sequelize.literal('UUID'),
      defaultValue: null,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    name: {
      type: Sequelize.literal('VARCHAR(255)'),
      allowNull: false,
    },
    designation: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: null,
    },
    sign_method: {
      type: Sequelize.ENUM('DRAW', 'OTP'),
      allowNull: false,
      defaultValue: 'DRAW',
    },
    signature_data: {
      type: Sequelize.literal('TEXT'),
      defaultValue: null,
    },
    otp_verified: {
      type: Sequelize.literal('BOOLEAN'),
      allowNull: false,
      defaultValue: false,
    },
    signed_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      defaultValue: null,
    },
    delete_reason: {
      type: Sequelize.literal('VARCHAR(255)'),
      defaultValue: null,
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
    },
  });

  // -----------------------------------------------------------------------
  // TABLE: system_settings
  // DESCRIPTION: Global key-value configuration for application toggles.
  // -----------------------------------------------------------------------
  await queryInterface.createTable('system_settings', {
    key: {
      type: Sequelize.literal('VARCHAR(255)'),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: Sequelize.literal('TEXT'),
    },
    description: {
      type: Sequelize.literal('VARCHAR(255)'),
    },
    created_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.literal('TIMESTAMP WITH TIME ZONE'),
      allowNull: false,
    },
  });


}

export async function down(queryInterface, Sequelize) {
  // Drop tables in strict reverse-topological order to prevent Foreign Key constraint errors
  await queryInterface.dropTable('system_settings', { cascade: true });
  await queryInterface.dropTable('survey_signoffs', { cascade: true });
  await queryInterface.dropTable('survey_answers', { cascade: true });
  await queryInterface.dropTable('survey_responses', { cascade: true });
  await queryInterface.dropTable('survey_question_options', { cascade: true });
  await queryInterface.dropTable('survey_questions', { cascade: true });
  await queryInterface.dropTable('survey_sections', { cascade: true });
  await queryInterface.dropTable('survey_templates', { cascade: true });
  await queryInterface.dropTable('company_sites', { cascade: true });
  await queryInterface.dropTable('company_details', { cascade: true });
  await queryInterface.dropTable('user_approvals', { cascade: true });
  await queryInterface.dropTable('company_membership_history', { cascade: true });
  await queryInterface.dropTable('certificates', { cascade: true });
  await queryInterface.dropTable('level_recommendations', { cascade: true });
  await queryInterface.dropTable('question_options', { cascade: true });
  await queryInterface.dropTable('questions', { cascade: true });
  await queryInterface.dropTable('content_progress', { cascade: true });
  await queryInterface.dropTable('level_enrollments', { cascade: true });
  await queryInterface.dropTable('payments', { cascade: true });
  await queryInterface.dropTable('order_items', { cascade: true });
  await queryInterface.dropTable('orders', { cascade: true });
  await queryInterface.dropTable('ref_job_skills', { cascade: true });
  await queryInterface.dropTable('ref_skills', { cascade: true });
  await queryInterface.dropTable('audit_logs', { cascade: true });
  await queryInterface.dropTable('content_items', { cascade: true });
  await queryInterface.dropTable('course_levels', { cascade: true });
  await queryInterface.dropTable('courses', { cascade: true });
  await queryInterface.dropTable('ref_jobs', { cascade: true });
  await queryInterface.dropTable('ref_categories', { cascade: true });
  await queryInterface.dropTable('users', { cascade: true });
  await queryInterface.dropTable('companies', { cascade: true });
  await queryInterface.dropTable('ref_industries', { cascade: true });

}
