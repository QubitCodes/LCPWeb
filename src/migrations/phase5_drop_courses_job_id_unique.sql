-- phase5_drop_courses_job_id_unique.sql
-- Removes the 1-to-1 rigid database constraint to support dynamic system settings
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_job_id_key";
