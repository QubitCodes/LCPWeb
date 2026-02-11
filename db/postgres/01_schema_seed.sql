-- ====================================================================================
-- POSTGRESQL SCHEMA SCRIPT FOR LMS WORKFORCE APP
-- ====================================================================================

-- 1. EXTENSIONS & CLEANUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS "company_membership_history" CASCADE;
DROP TABLE IF EXISTS "certificates" CASCADE;
DROP TABLE IF EXISTS "level_recommendations" CASCADE;
DROP TABLE IF EXISTS "question_options" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "content_progress" CASCADE;
DROP TABLE IF EXISTS "level_enrollments" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "order_items" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "job_skills" CASCADE;
DROP TABLE IF EXISTS "skills" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "content_items" CASCADE;
DROP TABLE IF EXISTS "course_levels" CASCADE;
DROP TABLE IF EXISTS "courses" CASCADE;
DROP TABLE IF EXISTS "jobs" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS "enum_users_role";
DROP TYPE IF EXISTS "enum_companies_status";
DROP TYPE IF EXISTS "enum_content_items_type";
DROP TYPE IF EXISTS "enum_orders_status";
DROP TYPE IF EXISTS "enum_payments_provider";
DROP TYPE IF EXISTS "enum_payments_status";
DROP TYPE IF EXISTS "enum_enrollments_status";
DROP TYPE IF EXISTS "enum_progress_status";
DROP TYPE IF EXISTS "enum_recommendations_status";

-- 2. CREATE TABLES

-- COMPANIES
CREATE TYPE "enum_companies_status" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING');
CREATE TABLE "companies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "registration_number" VARCHAR(255),
  "contact_email" VARCHAR(255),
  "contact_phone" VARCHAR(255),
  "status" "enum_companies_status" DEFAULT 'PENDING',
  "documents" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- USERS
CREATE TYPE "enum_users_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'WORKER');
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255) NOT NULL,
  "role" "enum_users_role" DEFAULT 'WORKER',
  "phone_number" VARCHAR(255),
  "company_id" UUID REFERENCES "companies" ("id") ON DELETE SET NULL,
  "years_experience" INTEGER DEFAULT 0,
  "documents" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- CATEGORIES
CREATE TABLE "categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- SKILLS
CREATE TABLE "skills" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- JOBS
CREATE TABLE "jobs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "category_id" UUID NOT NULL REFERENCES "categories" ("id"),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- JOB SKILLS
CREATE TABLE "job_skills" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" UUID NOT NULL REFERENCES "jobs" ("id") ON DELETE CASCADE,
  "skill_id" UUID NOT NULL REFERENCES "skills" ("id") ON DELETE CASCADE,
  "difficulty_level" VARCHAR(50) DEFAULT 'BASIC' CHECK ("difficulty_level" IN ('BASIC', 'INTERMEDIATE', 'ADVANCED')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COURSES
CREATE TABLE "courses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" UUID NOT NULL UNIQUE REFERENCES "jobs" ("id"),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- COURSE LEVELS
CREATE TABLE "course_levels" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_id" UUID NOT NULL REFERENCES "courses" ("id"),
  "level_number" INTEGER NOT NULL CHECK ("level_number" BETWEEN 1 AND 4),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "fast_track_experience_required" INTEGER,
  "completion_window_days" INTEGER DEFAULT 30,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  UNIQUE("course_id", "level_number")
);

-- CONTENT ITEMS
CREATE TYPE "enum_content_items_type" AS ENUM('VIDEO', 'QUESTIONNAIRE');
CREATE TABLE "content_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id"),
  "title" VARCHAR(255) NOT NULL,
  "type" "enum_content_items_type" NOT NULL,
  "sequence_order" INTEGER NOT NULL,
  "video_url" VARCHAR(500),
  "video_duration_seconds" INTEGER,
  "min_watch_percentage" INTEGER DEFAULT 90,
  "is_eligibility_check" BOOLEAN DEFAULT FALSE,
  "is_final_exam" BOOLEAN DEFAULT FALSE,
  "passing_score" INTEGER,
  "retry_threshold" INTEGER,
  "max_attempts_allowed" INTEGER,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

-- QUESTIONS
CREATE TABLE "questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_item_id" UUID NOT NULL REFERENCES "content_items" ("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "type" VARCHAR(50) DEFAULT 'MCQ' CHECK ("type" IN ('MCQ', 'TEXT')),
  "points" INTEGER DEFAULT 1,
  "sequence_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUESTION OPTIONS
CREATE TABLE "question_options" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" UUID NOT NULL REFERENCES "questions" ("id") ON DELETE CASCADE,
  "text" VARCHAR(255) NOT NULL,
  "is_correct" BOOLEAN DEFAULT FALSE,
  "order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "users" ("id") ON DELETE SET NULL,
  "action" VARCHAR(255) NOT NULL,
  "entity_type" VARCHAR(100),
  "entity_id" VARCHAR(100),
  "details" JSONB,
  "ip_address" VARCHAR(50),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDERS
CREATE TYPE "enum_orders_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED');
CREATE TABLE "orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users" ("id"),
  "company_id" UUID REFERENCES "companies" ("id"),
  "total_amount" DECIMAL(10, 2) DEFAULT 0.00,
  "currency" VARCHAR(3) DEFAULT 'USD',
  "status" "enum_orders_status" DEFAULT 'PENDING',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE "order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
  "worker_id" UUID NOT NULL REFERENCES "users" ("id"),
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id"),
  "price" DECIMAL(10, 2) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAYMENTS
CREATE TYPE "enum_payments_provider" AS ENUM('STRIPE', 'MANUAL');
CREATE TYPE "enum_payments_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
CREATE TABLE "payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "orders" ("id"),
  "provider" "enum_payments_provider" NOT NULL,
  "provider_transaction_id" VARCHAR(255),
  "amount" DECIMAL(10, 2) NOT NULL,
  "status" "enum_payments_status" DEFAULT 'PENDING',
  "proof_document_url" VARCHAR(500),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LEVEL ENROLLMENTS
CREATE TYPE "enum_enrollments_status" AS ENUM('ACTIVE', 'COMPLETED', 'FAILED', 'EXPIRED');
CREATE TABLE "level_enrollments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "worker_id" UUID NOT NULL REFERENCES "users" ("id"),
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id"),
  "start_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "deadline_date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "status" "enum_enrollments_status" DEFAULT 'ACTIVE',
  "completion_date" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONTENT PROGRESS
CREATE TYPE "enum_progress_status" AS ENUM('LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
CREATE TABLE "content_progress" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "worker_id" UUID NOT NULL REFERENCES "users" ("id"),
  "enrollment_id" UUID NOT NULL REFERENCES "level_enrollments" ("id"),
  "content_item_id" UUID NOT NULL REFERENCES "content_items" ("id"),
  "status" "enum_progress_status" DEFAULT 'LOCKED',
  "watch_percentage" INTEGER DEFAULT 0,
  "quiz_score" INTEGER,
  "attempts_count" INTEGER DEFAULT 0,
  "last_accessed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("enrollment_id", "content_item_id")
);

-- RECOMMENDATIONS
CREATE TYPE "enum_recommendations_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
CREATE TABLE "level_recommendations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "worker_id" UUID NOT NULL REFERENCES "users" ("id"),
  "company_id" UUID NOT NULL REFERENCES "companies" ("id"),
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id"),
  "recommended_by_id" UUID NOT NULL REFERENCES "users" ("id"),
  "reason" TEXT NOT NULL,
  "status" "enum_recommendations_status" DEFAULT 'PENDING',
  "admin_comment" TEXT,
  "approved_by_admin_id" UUID REFERENCES "users" ("id"),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CERTIFICATES
CREATE TABLE "certificates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "worker_id" UUID NOT NULL REFERENCES "users" ("id"),
  "enrollment_id" UUID NOT NULL UNIQUE REFERENCES "level_enrollments" ("id"),
  "course_level_id" UUID NOT NULL REFERENCES "course_levels" ("id"),
  "certificate_code" VARCHAR(100) NOT NULL UNIQUE,
  "issue_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "pdf_url" VARCHAR(500),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MEMBERSHIP HISTORY
CREATE TABLE "company_membership_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users" ("id"),
  "from_company_id" UUID REFERENCES "companies" ("id"),
  "to_company_id" UUID REFERENCES "companies" ("id"),
  "effective_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "initiated_by_user_id" UUID NOT NULL REFERENCES "users" ("id"),
  "reason" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SEED ESSENTIAL SYSTEM DATA

-- Super Admin User
-- Password is 'password123' hashed with bcrypt
INSERT INTO "users" (id, first_name, last_name, email, password_hash, role, phone_number, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Super',
  'Admin',
  'admin@lms.com',
  '$2a$12$hvEhtv0gT5Nz8k2iuEEYoeHhgHpThTyFhigRfKTL1Qbpc4s3ZHJMm', -- Placeholder hash, use real hash in prod
  'SUPER_ADMIN',
  '000-000-0000',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Initial Skills
INSERT INTO "skills" (name) VALUES 
('Bricklaying'), ('Concrete Pouring'), ('Blueprint Reading'), ('Safety Protocol'), ('Heavy Machinery')
ON CONFLICT (name) DO NOTHING;

-- Initial Categories
INSERT INTO "categories" (name, description) VALUES 
('Construction', 'General construction and masonry'),
('Electrical', 'Wiring and systems'),
('Plumbing', 'Piping and water systems')
ON CONFLICT DO NOTHING;
