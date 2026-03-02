-- ============================================================
-- Migration: Create all 7 survey engine tables
-- Phase 2: Dynamic Survey Engine — Database Schema
-- ============================================================

-- 1. survey_templates
CREATE TABLE IF NOT EXISTS `survey_templates` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `industry_id` CHAR(36) DEFAULT NULL COMMENT 'FK to ref_industries — NULL = universal',
    `type` ENUM('SURVEY','QUIZ') NOT NULL DEFAULT 'SURVEY',
    `status` ENUM('ACTIVE','INACTIVE','DRAFT') NOT NULL DEFAULT 'DRAFT',
    `created_by` CHAR(36) DEFAULT NULL COMMENT 'FK to users — template creator',
    `delete_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_survey_templates_industry` (`industry_id`),
    KEY `idx_survey_templates_status` (`status`),
    CONSTRAINT `fk_survey_templates_industry` FOREIGN KEY (`industry_id`) REFERENCES `ref_industries` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_survey_templates_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 2. survey_sections
CREATE TABLE IF NOT EXISTS `survey_sections` (
    `id` CHAR(36) NOT NULL,
    `template_id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `sequence_order` INT NOT NULL DEFAULT 0,
    `is_wizard_step` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'If true, starts a new wizard page',
    `delete_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_sections_template` (`template_id`),
    KEY `idx_sections_order` (`template_id`, `sequence_order`),
    CONSTRAINT `fk_sections_template` FOREIGN KEY (`template_id`) REFERENCES `survey_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 3. survey_questions
CREATE TABLE IF NOT EXISTS `survey_questions` (
    `id` CHAR(36) NOT NULL,
    `section_id` CHAR(36) NOT NULL,
    `text` TEXT NOT NULL,
    `type` ENUM('TEXT','NUMBER','DECIMAL','YES_NO','SELECT','MULTI_SELECT','DATE','FILE_UPLOAD','USER_SELECT') NOT NULL DEFAULT 'TEXT',
    `is_required` TINYINT(1) NOT NULL DEFAULT 0,
    `sequence_order` INT NOT NULL DEFAULT 0,
    `points` INT NOT NULL DEFAULT 0 COMMENT 'Used only when template type = QUIZ',
    `config` JSON DEFAULT NULL COMMENT 'Extra settings: placeholder, min, max, accept types, etc.',
    `delete_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_questions_section` (`section_id`),
    KEY `idx_questions_order` (`section_id`, `sequence_order`),
    CONSTRAINT `fk_questions_section` FOREIGN KEY (`section_id`) REFERENCES `survey_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 4. survey_question_options
CREATE TABLE IF NOT EXISTS `survey_question_options` (
    `id` CHAR(36) NOT NULL,
    `question_id` CHAR(36) NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    `is_correct` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'QUIZ mode only',
    `sequence_order` INT NOT NULL DEFAULT 0,
    `delete_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_options_question` (`question_id`),
    CONSTRAINT `fk_options_question` FOREIGN KEY (`question_id`) REFERENCES `survey_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 5. survey_responses
CREATE TABLE IF NOT EXISTS `survey_responses` (
    `id` CHAR(36) NOT NULL,
    `template_id` CHAR(36) NOT NULL,
    `site_id` CHAR(36) DEFAULT NULL COMMENT 'FK to company_sites — nullable',
    `company_id` CHAR(36) NOT NULL,
    `respondent_id` CHAR(36) NOT NULL COMMENT 'FK to users — who filled it',
    `status` ENUM('DRAFT','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `completed_at` DATETIME DEFAULT NULL,
    `delete_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_responses_template` (`template_id`),
    KEY `idx_responses_site` (`site_id`),
    KEY `idx_responses_company` (`company_id`),
    KEY `idx_responses_respondent` (`respondent_id`),
    KEY `idx_responses_status` (`status`),
    CONSTRAINT `fk_responses_template` FOREIGN KEY (`template_id`) REFERENCES `survey_templates` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_responses_site` FOREIGN KEY (`site_id`) REFERENCES `company_sites` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_responses_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_responses_respondent` FOREIGN KEY (`respondent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 6. survey_answers
CREATE TABLE IF NOT EXISTS `survey_answers` (
    `id` CHAR(36) NOT NULL,
    `response_id` CHAR(36) NOT NULL,
    `question_id` CHAR(36) NOT NULL,
    `answer_text` TEXT DEFAULT NULL COMMENT 'For simple answer types',
    `answer_json` JSON DEFAULT NULL COMMENT 'For complex answers (multi-select, files)',
    `delete_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_answers_response` (`response_id`),
    KEY `idx_answers_question` (`question_id`),
    UNIQUE KEY `uq_answers_response_question` (`response_id`, `question_id`),
    CONSTRAINT `fk_answers_response` FOREIGN KEY (`response_id`) REFERENCES `survey_responses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `survey_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- 7. survey_signoffs
CREATE TABLE IF NOT EXISTS `survey_signoffs` (
    `id` CHAR(36) NOT NULL,
    `response_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) DEFAULT NULL COMMENT 'FK to users — NULL for external signers',
    `name` VARCHAR(255) NOT NULL,
    `designation` VARCHAR(255) DEFAULT NULL,
    `sign_method` ENUM('DRAW','OTP') NOT NULL DEFAULT 'DRAW',
    `signature_data` TEXT DEFAULT NULL COMMENT 'Base64 drawn signature',
    `otp_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `signed_at` DATETIME DEFAULT NULL,
    `delete_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_signoffs_response` (`response_id`),
    KEY `idx_signoffs_user` (`user_id`),
    CONSTRAINT `fk_signoffs_response` FOREIGN KEY (`response_id`) REFERENCES `survey_responses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_signoffs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ============================================================
-- ROLLBACK (drop in reverse dependency order)
-- ============================================================
-- DROP TABLE IF EXISTS `survey_signoffs`;
-- DROP TABLE IF EXISTS `survey_answers`;
-- DROP TABLE IF EXISTS `survey_responses`;
-- DROP TABLE IF EXISTS `survey_question_options`;
-- DROP TABLE IF EXISTS `survey_questions`;
-- DROP TABLE IF EXISTS `survey_sections`;
-- DROP TABLE IF EXISTS `survey_templates`;
