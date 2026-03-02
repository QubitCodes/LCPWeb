-- ============================================================
-- Migration: Add DATA_SELECT to survey_questions.type enum
-- ============================================================
-- PostgreSQL: Add new enum value to existing ENUM type
-- This is safe and non-destructive — existing data is unaffected.
-- ============================================================

-- Add DATA_SELECT to the question type enum
ALTER TYPE "enum_survey_questions_type" ADD VALUE IF NOT EXISTS 'DATA_SELECT';

-- Verification: Check the enum values after migration
-- SELECT unnest(enum_range(NULL::"enum_survey_questions_type"));
