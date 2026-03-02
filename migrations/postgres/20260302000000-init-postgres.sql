-- ====================================================================================
-- SCRIPT: 20260302000000-init-postgres.sql (RAW EQUIVALENT FOR SEQUELIZE MIGRATION)
-- PATTERN: Primary Key -> Base Data -> Foreign Keys -> Other Data -> Status -> Audit
-- ====================================================================================

-- ENUMS
DROP TYPE IF EXISTS "enum_companies_status" CASCADE;
DROP TYPE IF EXISTS "enum_companies_approval_status" CASCADE;
DROP TYPE IF EXISTS "enum_users_role" CASCADE;
DROP TYPE IF EXISTS "enum_users_status" CASCADE;
DROP TYPE IF EXISTS "enum_orders_status" CASCADE;
DROP TYPE IF EXISTS "enum_payments_provider" CASCADE;
DROP TYPE IF EXISTS "enum_payments_status" CASCADE;
DROP TYPE IF EXISTS "enum_enrollments_status" CASCADE;
DROP TYPE IF EXISTS "enum_progress_status" CASCADE;
DROP TYPE IF EXISTS "enum_recommendations_status" CASCADE;
DROP TYPE IF EXISTS "enum_survey_templates_type" CASCADE;
DROP TYPE IF EXISTS "enum_survey_templates_status" CASCADE;
DROP TYPE IF EXISTS "enum_survey_questions_type" CASCADE;
DROP TYPE IF EXISTS "enum_survey_responses_status" CASCADE;
DROP TYPE IF EXISTS "enum_survey_signoffs_method" CASCADE;
CREATE TYPE "enum_companies_status" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING');
CREATE TYPE "enum_companies_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "enum_users_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'WORKER');
CREATE TYPE "enum_users_status" AS ENUM('ACTIVE', 'PENDING', 'SUSPENDED');
CREATE TYPE "enum_orders_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED');
CREATE TYPE "enum_payments_provider" AS ENUM('STRIPE', 'MANUAL');
CREATE TYPE "enum_payments_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "enum_enrollments_status" AS ENUM('ACTIVE', 'COMPLETED', 'FAILED', 'EXPIRED');
CREATE TYPE "enum_progress_status" AS ENUM('LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
CREATE TYPE "enum_recommendations_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "enum_survey_templates_type" AS ENUM('SURVEY', 'QUIZ');
CREATE TYPE "enum_survey_templates_status" AS ENUM('ACTIVE', 'INACTIVE', 'DRAFT');
CREATE TYPE "enum_survey_questions_type" AS ENUM('TEXT', 'NUMBER', 'DECIMAL', 'YES_NO', 'SELECT', 'MULTI_SELECT', 'DATE', 'FILE_UPLOAD', 'USER_SELECT', 'DATA_SELECT');
CREATE TYPE "enum_survey_responses_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "enum_survey_signoffs_method" AS ENUM('DRAW', 'OTP');

-- 1. ref_industries
CREATE TABLE "ref_industries" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 2. ref_categories
CREATE TABLE "ref_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 3. ref_jobs
CREATE TABLE "ref_jobs" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "category_id" INTEGER NOT NULL REFERENCES "ref_categories" ("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 4. skills
CREATE TABLE "skills" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 5. job_skills
CREATE TABLE "job_skills" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "difficulty_level" VARCHAR(50) DEFAULT 'BASIC',
  "job_id" INTEGER NOT NULL REFERENCES "ref_jobs" ("id") ON DELETE CASCADE,
  "skill_id" UUID NOT NULL REFERENCES "skills" ("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 6. companies
CREATE TABLE "companies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "company_id" VARCHAR(255) UNIQUE NOT NULL,
  "tax_id" VARCHAR(255),
  "address" TEXT,
  "website" VARCHAR(255),
  "contact_email" VARCHAR(255),
  "contact_phone" VARCHAR(255),
  "industry_id" INTEGER REFERENCES "ref_industries" ("id") ON DELETE SET NULL,
  "documents" JSONB DEFAULT '[]',
  "approval_status" "enum_companies_approval_status" DEFAULT 'PENDING',
  "status" "enum_companies_status" DEFAULT 'PENDING',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 7. users
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(255) UNIQUE NOT NULL,
  "country_code" VARCHAR(50) DEFAULT '+971',
  "email" VARCHAR(255) UNIQUE,
  "firebase_uid" VARCHAR(255) UNIQUE,
  "company_id" UUID REFERENCES "companies" ("id") ON DELETE SET NULL,
  "years_experience" INTEGER DEFAULT 0,
  "documents" JSONB DEFAULT '[]',
  "role" "enum_users_role" DEFAULT 'WORKER',
  "status" "enum_users_status" DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 8. user_approvals
CREATE TABLE "user_approvals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_comment" TEXT,
  "user_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "company_id" UUID REFERENCES "companies" ("id") ON DELETE SET NULL,
  "approved_by" UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "status" "enum_recommendations_status" DEFAULT 'PENDING',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 9. company_membership_history
CREATE TABLE "company_membership_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reason" TEXT,
  "user_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "from_company_id" UUID REFERENCES "companies" ("id"),
  "to_company_id" UUID REFERENCES "companies" ("id"),
  "initiated_by_user_id" UUID NOT NULL REFERENCES "users" ("id"),
  "effective_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 10. company_details
CREATE TABLE "company_details" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "about" TEXT,
  "logo_url" VARCHAR(500),
  "website_url" VARCHAR(500),
  "address" TEXT,
  "company_id" UUID NOT NULL UNIQUE REFERENCES "companies" ("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 11. company_sites
CREATE TABLE "company_sites" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "location" TEXT,
  "company_id" UUID NOT NULL REFERENCES "companies" ("id") ON DELETE CASCADE,
  "contractor_rep_id" UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "site_supervisor_id" UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "status" "enum_companies_status" DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 12. audit_logs
CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "action" VARCHAR(255) NOT NULL,
  "entity_type" VARCHAR(100),
  "entity_id" VARCHAR(100),
  "details" JSONB,
  "ip_address" VARCHAR(50),
  "user_id" UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. survey_templates
CREATE TABLE "survey_templates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "slug" VARCHAR(255) UNIQUE,
  "is_system" BOOLEAN DEFAULT false,
  "industry_id" INTEGER REFERENCES "ref_industries" ("id") ON DELETE SET NULL,
  "created_by" UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "type" "enum_survey_templates_type" DEFAULT 'SURVEY',
  "status" "enum_survey_templates_status" DEFAULT 'DRAFT',
  "delete_reason" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 14. survey_sections
CREATE TABLE "survey_sections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "sequence_order" INTEGER DEFAULT 0,
  "is_wizard_step" BOOLEAN DEFAULT false,
  "template_id" UUID NOT NULL REFERENCES "survey_templates" ("id") ON DELETE CASCADE,
  "delete_reason" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 15. survey_questions
CREATE TABLE "survey_questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "text" TEXT NOT NULL,
  "is_required" BOOLEAN DEFAULT false,
  "sequence_order" INTEGER DEFAULT 0,
  "points" INTEGER DEFAULT 0,
  "config" JSONB,
  "section_id" UUID NOT NULL REFERENCES "survey_sections" ("id") ON DELETE CASCADE,
  "type" "enum_survey_questions_type" DEFAULT 'TEXT',
  "delete_reason" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 16. survey_question_options
CREATE TABLE "survey_question_options" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "text" VARCHAR(255) NOT NULL,
  "value" VARCHAR(255) NOT NULL,
  "is_correct" BOOLEAN DEFAULT false,
  "sequence_order" INTEGER DEFAULT 0,
  "question_id" UUID NOT NULL REFERENCES "survey_questions" ("id") ON DELETE CASCADE,
  "delete_reason" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 17. survey_responses
CREATE TABLE "survey_responses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "template_id" UUID NOT NULL REFERENCES "survey_templates" ("id") ON DELETE CASCADE,
  "site_id" UUID REFERENCES "company_sites" ("id") ON DELETE SET NULL,
  "company_id" UUID NOT NULL REFERENCES "companies" ("id") ON DELETE CASCADE,
  "respondent_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "status" "enum_survey_responses_status" DEFAULT 'DRAFT',
  "delete_reason" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 18. survey_answers
CREATE TABLE "survey_answers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "answer_text" TEXT,
  "answer_json" JSONB,
  "response_id" UUID NOT NULL REFERENCES "survey_responses" ("id") ON DELETE CASCADE,
  "question_id" UUID NOT NULL REFERENCES "survey_questions" ("id") ON DELETE CASCADE,
  "delete_reason" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 19. survey_signoffs
CREATE TABLE "survey_signoffs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "designation" VARCHAR(255),
  "signature_data" TEXT,
  "otp_verified" BOOLEAN DEFAULT false,
  "signed_at" TIMESTAMP WITH TIME ZONE,
  "response_id" UUID NOT NULL REFERENCES "survey_responses" ("id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "sign_method" "enum_survey_signoffs_method" DEFAULT 'DRAW',
  "delete_reason" VARCHAR(255),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 20. courses
CREATE TABLE "courses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "job_id" INTEGER NOT NULL UNIQUE REFERENCES "ref_jobs" ("id") ON DELETE CASCADE,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 21. course_levels
CREATE TABLE "course_levels" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "level_number" INTEGER NOT NULL,
  "fast_track_experience_required" INTEGER,
  "completion_window_days" INTEGER DEFAULT 30,
  "course_id" UUID NOT NULL REFERENCES "courses" ("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 22. content_items
CREATE TABLE "content_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "sequence_order" INTEGER NOT NULL,
  "video_url" VARCHAR(500),
  "video_duration_seconds" INTEGER,
  "min_watch_percentage" INTEGER DEFAULT 90,
  "passing_score" INTEGER,
  "retry_threshold" INTEGER,
  "max_attempts_allowed" INTEGER,
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id") ON DELETE CASCADE,
  "is_eligibility_check" BOOLEAN DEFAULT false,
  "is_final_exam" BOOLEAN DEFAULT false,
  "type" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- 23. questions
CREATE TABLE "questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "text" TEXT NOT NULL,
  "points" INTEGER DEFAULT 1,
  "sequence_order" INTEGER DEFAULT 0,
  "content_item_id" UUID NOT NULL REFERENCES "content_items" ("id") ON DELETE CASCADE,
  "type" VARCHAR(50) DEFAULT 'MCQ',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. question_options
CREATE TABLE "question_options" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "text" VARCHAR(255) NOT NULL,
  "order" INTEGER DEFAULT 0,
  "question_id" UUID NOT NULL REFERENCES "questions" ("id") ON DELETE CASCADE,
  "is_correct" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. orders
CREATE TABLE "orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "total_amount" DECIMAL(10, 2) DEFAULT 0.00,
  "currency" VARCHAR(3) DEFAULT 'USD',
  "user_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,
  "company_id" UUID REFERENCES "companies" ("id") ON DELETE RESTRICT,
  "status" "enum_orders_status" DEFAULT 'PENDING',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 26. order_items
CREATE TABLE "order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "price" DECIMAL(10, 2) NOT NULL,
  "order_id" UUID NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
  "worker_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE RESTRICT,
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id") ON DELETE RESTRICT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 27. payments
CREATE TABLE "payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider_transaction_id" VARCHAR(255),
  "amount" DECIMAL(10, 2) NOT NULL,
  "proof_document_url" VARCHAR(500),
  "order_id" UUID NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
  "provider" "enum_payments_provider" NOT NULL,
  "status" "enum_payments_status" DEFAULT 'PENDING',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 28. level_enrollments
CREATE TABLE "level_enrollments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "start_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deadline_date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "completion_date" TIMESTAMP WITH TIME ZONE,
  "worker_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id") ON DELETE CASCADE,
  "status" "enum_enrollments_status" DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 29. content_progress
CREATE TABLE "content_progress" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "watch_percentage" INTEGER DEFAULT 0,
  "quiz_score" INTEGER,
  "attempts_count" INTEGER DEFAULT 0,
  "last_accessed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "worker_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "enrollment_id" UUID NOT NULL REFERENCES "level_enrollments" ("id") ON DELETE CASCADE,
  "content_item_id" UUID NOT NULL REFERENCES "content_items" ("id") ON DELETE CASCADE,
  "status" "enum_progress_status" DEFAULT 'LOCKED',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 30. level_recommendations
CREATE TABLE "level_recommendations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reason" TEXT NOT NULL,
  "admin_comment" TEXT,
  "worker_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "company_id" UUID NOT NULL REFERENCES "companies" ("id") ON DELETE CASCADE,
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id") ON DELETE CASCADE,
  "recommended_by_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "approved_by_admin_id" UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "status" "enum_recommendations_status" DEFAULT 'PENDING',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 31. certificates
CREATE TABLE "certificates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "certificate_code" VARCHAR(100) NOT NULL UNIQUE,
  "issue_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "pdf_url" VARCHAR(500),
  "worker_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "enrollment_id" UUID NOT NULL UNIQUE REFERENCES "level_enrollments" ("id") ON DELETE CASCADE,
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
