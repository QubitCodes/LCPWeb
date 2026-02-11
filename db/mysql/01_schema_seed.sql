-- ====================================================================================
-- MYSQL SCHEMA SCRIPT FOR LMS WORKFORCE APP
-- ====================================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. DROP TABLES
DROP TABLE IF EXISTS company_membership_history;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS level_recommendations;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS content_progress;
DROP TABLE IF EXISTS level_enrollments;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS content_items;
DROP TABLE IF EXISTS course_levels;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

-- 2. CREATE TABLES

-- COMPANIES
CREATE TABLE companies (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'PENDING',
  documents JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME
) ENGINE=InnoDB;

-- USERS
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'WORKER') DEFAULT 'WORKER',
  phone_number VARCHAR(255),
  company_id CHAR(36),
  years_experience INTEGER DEFAULT 0,
  documents JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- CATEGORIES
CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME
) ENGINE=InnoDB;

-- SKILLS
CREATE TABLE skills (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME
) ENGINE=InnoDB;

-- JOBS
CREATE TABLE jobs (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- JOB SKILLS
CREATE TABLE job_skills (
  id CHAR(36) PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  skill_id CHAR(36) NOT NULL,
  difficulty_level ENUM('BASIC', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BASIC',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- COURSES
CREATE TABLE courses (
  id CHAR(36) PRIMARY KEY,
  job_id CHAR(36) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
) ENGINE=InnoDB;

-- COURSE LEVELS
CREATE TABLE course_levels (
  id CHAR(36) PRIMARY KEY,
  course_id CHAR(36) NOT NULL,
  level_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fast_track_experience_required INTEGER,
  completion_window_days INTEGER DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  UNIQUE KEY uk_course_level (course_id, level_number)
) ENGINE=InnoDB;

-- CONTENT ITEMS
CREATE TABLE content_items (
  id CHAR(36) PRIMARY KEY,
  course_level_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('VIDEO', 'QUESTIONNAIRE') NOT NULL,
  sequence_order INTEGER NOT NULL,
  video_url VARCHAR(500),
  video_duration_seconds INTEGER,
  min_watch_percentage INTEGER DEFAULT 90,
  is_eligibility_check BOOLEAN DEFAULT FALSE,
  is_final_exam BOOLEAN DEFAULT FALSE,
  passing_score INTEGER,
  retry_threshold INTEGER,
  max_attempts_allowed INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (course_level_id) REFERENCES course_levels(id)
) ENGINE=InnoDB;

-- QUESTIONS
CREATE TABLE questions (
  id CHAR(36) PRIMARY KEY,
  content_item_id CHAR(36) NOT NULL,
  text TEXT NOT NULL,
  type ENUM('MCQ', 'TEXT') DEFAULT 'MCQ',
  points INTEGER DEFAULT 1,
  sequence_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- QUESTION OPTIONS
CREATE TABLE question_options (
  id CHAR(36) PRIMARY KEY,
  question_id CHAR(36) NOT NULL,
  text VARCHAR(255) NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  order_seq INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  details JSON,
  ip_address VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ORDERS
CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  company_id CHAR(36),
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

-- ORDER ITEMS
CREATE TABLE order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  worker_id CHAR(36) NOT NULL,
  course_level_id CHAR(36) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (course_level_id) REFERENCES course_levels(id)
) ENGINE=InnoDB;

-- PAYMENTS
CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  provider ENUM('STRIPE', 'MANUAL') NOT NULL,
  provider_transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  proof_document_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- LEVEL ENROLLMENTS
CREATE TABLE level_enrollments (
  id CHAR(36) PRIMARY KEY,
  worker_id CHAR(36) NOT NULL,
  course_level_id CHAR(36) NOT NULL,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  deadline_date DATETIME NOT NULL,
  status ENUM('ACTIVE', 'COMPLETED', 'FAILED', 'EXPIRED') DEFAULT 'ACTIVE',
  completion_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (course_level_id) REFERENCES course_levels(id)
) ENGINE=InnoDB;

-- CONTENT PROGRESS
CREATE TABLE content_progress (
  id CHAR(36) PRIMARY KEY,
  worker_id CHAR(36) NOT NULL,
  enrollment_id CHAR(36) NOT NULL,
  content_item_id CHAR(36) NOT NULL,
  status ENUM('LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED', 'FAILED') DEFAULT 'LOCKED',
  watch_percentage INTEGER DEFAULT 0,
  quiz_score INTEGER,
  attempts_count INTEGER DEFAULT 0,
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (enrollment_id) REFERENCES level_enrollments(id),
  FOREIGN KEY (content_item_id) REFERENCES content_items(id),
  UNIQUE KEY uk_progress (enrollment_id, content_item_id)
) ENGINE=InnoDB;

-- RECOMMENDATIONS
CREATE TABLE level_recommendations (
  id CHAR(36) PRIMARY KEY,
  worker_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  course_level_id CHAR(36) NOT NULL,
  recommended_by_id CHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  admin_comment TEXT,
  approved_by_admin_id CHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (course_level_id) REFERENCES course_levels(id),
  FOREIGN KEY (recommended_by_id) REFERENCES users(id),
  FOREIGN KEY (approved_by_admin_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- CERTIFICATES
CREATE TABLE certificates (
  id CHAR(36) PRIMARY KEY,
  worker_id CHAR(36) NOT NULL,
  enrollment_id CHAR(36) NOT NULL UNIQUE,
  course_level_id CHAR(36) NOT NULL,
  certificate_code VARCHAR(100) NOT NULL UNIQUE,
  issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  pdf_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES users(id),
  FOREIGN KEY (enrollment_id) REFERENCES level_enrollments(id),
  FOREIGN KEY (course_level_id) REFERENCES course_levels(id)
) ENGINE=InnoDB;

-- MEMBERSHIP HISTORY
CREATE TABLE company_membership_history (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  from_company_id CHAR(36),
  to_company_id CHAR(36),
  effective_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  initiated_by_user_id CHAR(36) NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (from_company_id) REFERENCES companies(id),
  FOREIGN KEY (to_company_id) REFERENCES companies(id),
  FOREIGN KEY (initiated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- 3. SEED ESSENTIAL SYSTEM DATA

-- Super Admin User
INSERT IGNORE INTO users (id, first_name, last_name, email, password_hash, role, phone_number, created_at, updated_at)
VALUES (
  UUID(),
  'Super',
  'Admin',
  'admin@lms.com',
  '$2a$12$hvEhtv0gT5Nz8k2iuEEYoeHhgHpThTyFhigRfKTL1Qbpc4s3ZHJMm', 
  'SUPER_ADMIN',
  '000-000-0000',
  NOW(),
  NOW()
);

-- Initial Skills
INSERT IGNORE INTO skills (id, name) VALUES 
(UUID(), 'Bricklaying'), (UUID(), 'Concrete Pouring'), (UUID(), 'Blueprint Reading'), (UUID(), 'Safety Protocol'), (UUID(), 'Heavy Machinery');

-- Initial Categories
INSERT IGNORE INTO categories (id, name, description) VALUES 
(UUID(), 'Construction', 'General construction and masonry'),
(UUID(), 'Electrical', 'Wiring and systems'),
(UUID(), 'Plumbing', 'Piping and water systems');
