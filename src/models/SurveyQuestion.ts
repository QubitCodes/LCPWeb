import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * Question type enum — all supported dynamic field types.
 * TEXT: Free-text input
 * NUMBER: Integer input
 * DECIMAL: Float/decimal input
 * YES_NO: Boolean toggle / radio
 * SELECT: Single-choice dropdown
 * MULTI_SELECT: Multiple-choice checkboxes
 * DATE: Date picker
 * FILE_UPLOAD: File attachment
 * USER_SELECT: Dropdown of company users (supervisor, rep, etc.)
 * DATA_SELECT: Dropdown populated from a database entity (Company, Site, Course, Job, User)
 */
type QuestionType =
	| 'TEXT'
	| 'NUMBER'
	| 'DECIMAL'
	| 'YES_NO'
	| 'SELECT'
	| 'MULTI_SELECT'
	| 'DATE'
	| 'FILE_UPLOAD'
	| 'USER_SELECT'
	| 'DATA_SELECT';

/**
 * SurveyQuestion — Individual question within a section.
 * Supports multiple types with optional JSON config for extra settings.
 * Points field is only relevant when the parent template type = QUIZ.
 */
interface SurveyQuestionAttributes {
	id: string;
	/** FK to survey_sections */
	section_id: string;
	/** Question label / prompt text */
	text: string;
	/** The input type to render */
	type: QuestionType;
	/** Whether this question must be answered to complete the survey */
	is_required: boolean;
	/** Display order within the section */
	sequence_order: number;
	/** Points awarded for correct answer (QUIZ mode only) */
	points: number;
	/** Extra config: placeholder, min, max, accept types, etc. */
	config?: Record<string, any> | null;
	/** Reason for soft-delete */
	delete_reason?: string | null;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

interface SurveyQuestionCreationAttributes
	extends Optional<SurveyQuestionAttributes, 'id' | 'type' | 'is_required' | 'sequence_order' | 'points' | 'config' | 'delete_reason'> { }

class SurveyQuestion
	extends Model<SurveyQuestionAttributes, SurveyQuestionCreationAttributes>
	implements SurveyQuestionAttributes {
	declare public id: string;
	declare public section_id: string;
	declare public text: string;
	declare public type: QuestionType;
	declare public is_required: boolean;
	declare public sequence_order: number;
	declare public points: number;
	declare public config: Record<string, any> | null;
	declare public delete_reason: string | null;

	declare public readonly created_at: Date;
	declare public readonly updated_at: Date;
	declare public readonly deleted_at: Date;
}

(SurveyQuestion as any).init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		section_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		text: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		type: {
			type: DataTypes.ENUM(
				'TEXT', 'NUMBER', 'DECIMAL', 'YES_NO',
				'SELECT', 'MULTI_SELECT', 'DATE',
				'FILE_UPLOAD', 'USER_SELECT', 'DATA_SELECT'
			),
			allowNull: false,
			defaultValue: 'TEXT',
		},
		is_required: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		sequence_order: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		config: {
			type: DataTypes.JSON,
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
		tableName: 'survey_questions',
		timestamps: true,
		paranoid: true,
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at',
	}
);

export default SurveyQuestion;
