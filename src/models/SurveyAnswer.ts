import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * SurveyAnswer — Stores a respondent's answer to a specific question.
 * Simple answers (text, number, date, yes/no) go in answer_text.
 * Complex answers (multi-select arrays, file metadata, etc.) go in answer_json.
 */
interface SurveyAnswerAttributes {
	id: string;
	/** FK to survey_responses — which response this answer belongs to */
	response_id: string;
	/** FK to survey_questions — which question this answers */
	question_id: string;
	/** Plain-text answer for simple types (TEXT, NUMBER, DATE, YES_NO, SELECT) */
	answer_text?: string | null;
	/** JSON answer for complex types (MULTI_SELECT, FILE_UPLOAD, USER_SELECT) */
	answer_json?: Record<string, any> | any[] | null;
	/** Reason for soft-delete */
	delete_reason?: string | null;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

interface SurveyAnswerCreationAttributes
	extends Optional<SurveyAnswerAttributes, 'id' | 'answer_text' | 'answer_json' | 'delete_reason'> { }

class SurveyAnswer
	extends Model<SurveyAnswerAttributes, SurveyAnswerCreationAttributes>
	implements SurveyAnswerAttributes {
	declare public id: string;
	declare public response_id: string;
	declare public question_id: string;
	declare public answer_text: string | null;
	declare public answer_json: Record<string, any> | any[] | null;
	declare public delete_reason: string | null;

	declare public readonly created_at: Date;
	declare public readonly updated_at: Date;
	declare public readonly deleted_at: Date;
}

(SurveyAnswer as any).init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		response_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		question_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		answer_text: {
			type: DataTypes.TEXT,
			allowNull: true,
			defaultValue: null,
		},
		answer_json: {
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
		tableName: 'survey_answers',
		timestamps: true,
		paranoid: true,
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at',
	}
);

export default SurveyAnswer;
