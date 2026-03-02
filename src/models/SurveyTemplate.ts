import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * SurveyTemplate — Top-level definition for a survey or quiz.
 * A template contains sections, which contain questions.
 * Templates can be filtered by industry (NULL = universal).
 * Type SURVEY has no scoring; type QUIZ tracks points per question.
 */
interface SurveyTemplateAttributes {
	id: string;
	/** Human-readable template name, e.g. "LCP Site Validation Checklist" */
	name: string;
	/** URL-friendly unique identifier, auto-generated from name */
	slug?: string | null;
	/** Optional description or instructions for the survey */
	description?: string | null;
	/** FK to ref_industries — NULL means applicable to all industries */
	industry_id?: number | null;
	/** SURVEY = no scoring, QUIZ = has points per question */
	type: 'SURVEY' | 'QUIZ';
	/** Template lifecycle status */
	status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
	/** System templates are protected from deletion and editing of structure */
	is_system: boolean;
	/** FK to users — who created this template */
	created_by?: string | null;
	/** Reason for soft-delete */
	delete_reason?: string | null;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

interface SurveyTemplateCreationAttributes
	extends Optional<SurveyTemplateAttributes, 'id' | 'slug' | 'description' | 'industry_id' | 'type' | 'status' | 'is_system' | 'created_by' | 'delete_reason'> { }

class SurveyTemplate
	extends Model<SurveyTemplateAttributes, SurveyTemplateCreationAttributes>
	implements SurveyTemplateAttributes {
	declare public id: string;
	declare public name: string;
	declare public slug: string | null;
	declare public description: string | null;
	declare public industry_id: number | null;
	declare public type: 'SURVEY' | 'QUIZ';
	declare public status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
	declare public is_system: boolean;
	declare public created_by: string | null;
	declare public delete_reason: string | null;

	declare public readonly created_at: Date;
	declare public readonly updated_at: Date;
	declare public readonly deleted_at: Date;
}

(SurveyTemplate as any).init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		slug: {
			type: DataTypes.STRING(100),
			allowNull: true,
			unique: true,
			comment: 'URL-friendly unique identifier, auto-generated from name',
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
			defaultValue: null,
		},
		industry_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null,
		},
		type: {
			type: DataTypes.ENUM('SURVEY', 'QUIZ'),
			allowNull: false,
			defaultValue: 'SURVEY',
		},
		status: {
			type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'DRAFT'),
			allowNull: false,
			defaultValue: 'DRAFT',
		},
		is_system: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: 'System templates cannot be deleted',
		},
		created_by: {
			type: DataTypes.UUID,
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
		tableName: 'survey_templates',
		timestamps: true,
		paranoid: true,
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at',
	}
);

export default SurveyTemplate;
