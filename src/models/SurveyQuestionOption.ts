import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * SurveyQuestionOption — Predefined option for SELECT / MULTI_SELECT / YES_NO questions.
 * For QUIZ mode, is_correct marks the right answer(s).
 */
interface SurveyQuestionOptionAttributes {
	id: string;
	/** FK to survey_questions */
	question_id: string;
	/** Display label shown to the respondent */
	text: string;
	/** Stored value (may differ from display text) */
	value: string;
	/** Whether this is the correct answer (QUIZ mode only) */
	is_correct: boolean;
	/** Display order within the question's options */
	sequence_order: number;
	/** Reason for soft-delete */
	delete_reason?: string | null;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

interface SurveyQuestionOptionCreationAttributes
	extends Optional<SurveyQuestionOptionAttributes, 'id' | 'is_correct' | 'sequence_order' | 'delete_reason'> { }

class SurveyQuestionOption
	extends Model<SurveyQuestionOptionAttributes, SurveyQuestionOptionCreationAttributes>
	implements SurveyQuestionOptionAttributes {
	declare public id: string;
	declare public question_id: string;
	declare public text: string;
	declare public value: string;
	declare public is_correct: boolean;
	declare public sequence_order: number;
	declare public delete_reason: string | null;

	declare public readonly created_at: Date;
	declare public readonly updated_at: Date;
	declare public readonly deleted_at: Date;
}

(SurveyQuestionOption as any).init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		question_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		text: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		value: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		is_correct: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		sequence_order: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		delete_reason: {
			type: DataTypes.STRING(255),
			allowNull: true,
			defaultValue: null,
		},
	},
	{
		sequelize,
		tableName: 'survey_question_options',
		timestamps: true,
		paranoid: true,
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at',
	}
);

export default SurveyQuestionOption;
