import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Add slug and is_system columns to survey_templates.
 *
 * slug    — URL-friendly unique identifier (auto-generated from name).
 * is_system — Marks templates that ship with the platform and cannot be deleted.
 *
 * Raw SQL equivalent:
 * ─────────────────────────────────────────────────────────
 * ALTER TABLE survey_templates ADD COLUMN slug VARCHAR(100) UNIQUE;
 * ALTER TABLE survey_templates ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT FALSE;
 * ─────────────────────────────────────────────────────────
 */
export default {
	async up(queryInterface: QueryInterface) {
		await queryInterface.addColumn('survey_templates', 'slug', {
			type: DataTypes.STRING(100),
			allowNull: true,
			unique: true,
		});

		await queryInterface.addColumn('survey_templates', 'is_system', {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		});
	},

	async down(queryInterface: QueryInterface) {
		await queryInterface.removeColumn('survey_templates', 'is_system');
		await queryInterface.removeColumn('survey_templates', 'slug');
	},
};
