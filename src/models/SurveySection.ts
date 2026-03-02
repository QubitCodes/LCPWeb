import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * SurveySection — Groups questions within a template.
 * Sections are ordered by sequence_order.
 * If is_wizard_step is true, this section starts a new page/wizard step.
 */
interface SurveySectionAttributes {
	id: string;
	/** FK to survey_templates — which template this section belongs to */
	template_id: string;
	/** Section name, e.g. "A. Site & Employer Details" */
	name: string;
	/** Optional section description or guidance text */
	description?: string | null;
	/** Display order within the template */
	sequence_order: number;
	/** If true, this section starts a new wizard page in the accordion UI */
	is_wizard_step: boolean;
	/** Reason for soft-delete */
	delete_reason?: string | null;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

interface SurveySectionCreationAttributes
	extends Optional<SurveySectionAttributes, 'id' | 'description' | 'sequence_order' | 'is_wizard_step' | 'delete_reason'> { }

class SurveySection
	extends Model<SurveySectionAttributes, SurveySectionCreationAttributes>
	implements SurveySectionAttributes {
	declare public id: string;
	declare public template_id: string;
	declare public name: string;
	declare public description: string | null;
	declare public sequence_order: number;
	declare public is_wizard_step: boolean;
	declare public delete_reason: string | null;

	declare public readonly created_at: Date;
	declare public readonly updated_at: Date;
	declare public readonly deleted_at: Date;
}

(SurveySection as any).init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		template_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
			defaultValue: null,
		},
		sequence_order: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		is_wizard_step: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		delete_reason: {
			type: DataTypes.STRING(255),
			allowNull: true,
			defaultValue: null,
		},
	},
	{
		sequelize,
		tableName: 'survey_sections',
		timestamps: true,
		paranoid: true,
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at',
	}
);

export default SurveySection;
