-- ============================================================
-- Migration: Add site detail fields to company_sites table
-- Phase 1: Registration Flow Completion
-- ============================================================

-- Add columns for project stage, duration, and FK references
ALTER TABLE company_sites
  ADD COLUMN project_stage ENUM('FOUNDATION', 'STRUCTURE', 'MASONRY', 'FINISHING', 'MEP') NULL DEFAULT NULL
    COMMENT 'Current project stage at this site',
  ADD COLUMN expected_duration_months INT NULL DEFAULT NULL
    COMMENT 'Expected project duration in months',
  ADD COLUMN contractor_rep_id CHAR(36) NULL DEFAULT NULL
    COMMENT 'FK to users — contractor/company representative',
  ADD COLUMN site_supervisor_id CHAR(36) NULL DEFAULT NULL
    COMMENT 'FK to users — site supervisor / in-charge';

-- Add foreign key constraints
ALTER TABLE company_sites
  ADD CONSTRAINT fk_company_sites_contractor_rep
    FOREIGN KEY (contractor_rep_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_company_sites_site_supervisor
    FOREIGN KEY (site_supervisor_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Optional index for quick lookups
CREATE INDEX idx_company_sites_contractor_rep ON company_sites(contractor_rep_id);
CREATE INDEX idx_company_sites_site_supervisor ON company_sites(site_supervisor_id);

-- ============================================================
-- ROLLBACK
-- ============================================================
-- ALTER TABLE company_sites DROP FOREIGN KEY fk_company_sites_contractor_rep;
-- ALTER TABLE company_sites DROP FOREIGN KEY fk_company_sites_site_supervisor;
-- ALTER TABLE company_sites DROP INDEX idx_company_sites_contractor_rep;
-- ALTER TABLE company_sites DROP INDEX idx_company_sites_site_supervisor;
-- ALTER TABLE company_sites DROP COLUMN project_stage;
-- ALTER TABLE company_sites DROP COLUMN expected_duration_months;
-- ALTER TABLE company_sites DROP COLUMN contractor_rep_id;
-- ALTER TABLE company_sites DROP COLUMN site_supervisor_id;
