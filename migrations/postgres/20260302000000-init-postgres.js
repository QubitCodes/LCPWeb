'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
	up: async (queryInterface, Sequelize) => {
		// Read the optimized raw SQL file alongside this migration script
		console.log('--- Initializing highly-optimized PostgreSQL Schema ---');
		const sqlPath = path.join(__dirname, '20260302000000-init-postgres.sql');
		const sql = fs.readFileSync(sqlPath, 'utf8');

		// Execute the bulk SQL definition
		await queryInterface.sequelize.query(sql);
	},

	down: async (queryInterface, Sequelize) => {
		// Drop all tables in strict reverse-dependency order
		const tableDrops = [
			'certificates',
			'level_recommendations',
			'content_progress',
			'level_enrollments',
			'payments',
			'order_items',
			'orders',
			'question_options',
			'questions',
			'content_items',
			'course_levels',
			'courses',
			'survey_signoffs',
			'survey_answers',
			'survey_responses',
			'survey_question_options',
			'survey_questions',
			'survey_sections',
			'survey_templates',
			'audit_logs',
			'company_sites',
			'company_details',
			'company_membership_history',
			'user_approvals',
			'users',
			'companies',
			'job_skills',
			'skills',
			'ref_jobs',
			'ref_categories',
			'ref_industries'
		];

		for (const table of tableDrops) {
			await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
		}

		// Drop ENUM types
		const enums = [
			'enum_companies_status',
			'enum_companies_approval_status',
			'enum_users_role',
			'enum_users_status',
			'enum_orders_status',
			'enum_payments_provider',
			'enum_payments_status',
			'enum_enrollments_status',
			'enum_progress_status',
			'enum_recommendations_status',
			'enum_survey_templates_type',
			'enum_survey_templates_status',
			'enum_survey_questions_type',
			'enum_survey_responses_status',
			'enum_survey_signoffs_method'
		];

		for (const customEnum of enums) {
			await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${customEnum}" CASCADE;`);
		}
	}
};
