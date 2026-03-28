import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * SurveyResponse — A specific instance of a survey being filled out.
 * Links a template to a company, optionally a site, and a respondent.
 * Status tracks progress: DRAFT → IN_PROGRESS → COMPLETED.
 */
interface SurveyResponseAttributes {
	id: string;
	/** FK to survey_templates — which template is being filled */
	template_id: string;
	/** FK to company_sites — nullable; site this survey is for */
	site_id?: string | null;
	/** FK to companies — the company this response belongs to */
	company_id: string;
	/** FK to users — who is filling out the survey (Nullable until claimed) */
	respondent_id?: string | null;
	/** Completion status of this response */
	status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
	/** When the survey was marked complete */
	completed_at?: Date | null;
	/** Reason for soft-delete */
	delete_reason?: string | null;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

interface SurveyResponseCreationAttributes
	extends Optional<SurveyResponseAttributes, 'id' | 'site_id' | 'respondent_id' | 'status' | 'completed_at' | 'delete_reason'> { }

class SurveyResponse
	extends Model<SurveyResponseAttributes, SurveyResponseCreationAttributes>
	implements SurveyResponseAttributes {
	declare public id: string;
	declare public template_id: string;
	declare public site_id: string | null;
	declare public company_id: string;
	declare public respondent_id: string | null;
	declare public status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
	declare public completed_at: Date | null;
	declare public delete_reason: string | null;

	declare public readonly created_at: Date;
	declare public readonly updated_at: Date;
	declare public readonly deleted_at: Date;
}

(SurveyResponse as any).init(
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
		site_id: {
			type: DataTypes.UUID,
			allowNull: true,
			defaultValue: null,
		},
		company_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		respondent_id: {
			type: DataTypes.UUID,
			allowNull: true,
			defaultValue: null,
		},
		status: {
			type: DataTypes.ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED'),
			allowNull: false,
			defaultValue: 'DRAFT',
		},
		completed_at: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
		},
		delete_reason: {
			type: DataTypes.STRING(255),
			allowNull: true,
			defaultValue: null,
		},
	},
	{
		sequelize,
		tableName: 'survey_responses',
		timestamps: true,
		paranoid: true,
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at',
	}
);

export default SurveyResponse;
