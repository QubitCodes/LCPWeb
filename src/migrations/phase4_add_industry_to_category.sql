ALTER TABLE ref_categories ADD COLUMN industry_id INTEGER;
ALTER TABLE ref_categories ADD CONSTRAINT fk_category_industry FOREIGN KEY (industry_id) REFERENCES ref_industries (id) ON DELETE SET NULL;
