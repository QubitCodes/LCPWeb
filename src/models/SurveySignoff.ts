import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * SurveySignoff — Records a sign-off on a completed survey response.
 * Supports two methods: drawn signature (base64) or OTP verification.
 * Multiple signoffs per response are possible (e.g. supervisor + inspector).
 */
interface SurveySignoffAttributes {
	id: string;
	/** FK to survey_responses — which response this signoff is for */
	response_id: string;
	/** FK to users — nullable; if the signer is a registered user */
	user_id?: string | null;
	/** Full name of the signer (auto-filled from user or manual entry) */
	name: string;
	/** Job title / designation of the signer */
	designation?: string | null;
	/** Method used to sign: drawn signature or OTP verification */
	sign_method: 'DRAW' | 'OTP';
	/** Base64-encoded drawn signature image (DRAW method only) */
	signature_data?: string | null;
	/** Whether OTP was successfully verified (OTP method only) */
	otp_verified: boolean;
	/** Timestamp when the signoff was finalized */
	signed_at?: Date | null;
	/** Reason for soft-delete */
	delete_reason?: string | null;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

interface SurveySignoffCreationAttributes
	extends Optional<SurveySignoffAttributes, 'id' | 'user_id' | 'designation' | 'sign_method' | 'signature_data' | 'otp_verified' | 'signed_at' | 'delete_reason'> { }

class SurveySignoff
	extends Model<SurveySignoffAttributes, SurveySignoffCreationAttributes>
	implements SurveySignoffAttributes {
	declare public id: string;
	declare public response_id: string;
	declare public user_id: string | null;
	declare public name: string;
	declare public designation: string | null;
	declare public sign_method: 'DRAW' | 'OTP';
	declare public signature_data: string | null;
	declare public otp_verified: boolean;
	declare public signed_at: Date | null;
	declare public delete_reason: string | null;

	declare public readonly created_at: Date;
	declare public readonly updated_at: Date;
	declare public readonly deleted_at: Date;
}

(SurveySignoff as any).init(
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
		user_id: {
			type: DataTypes.UUID,
			allowNull: true,
			defaultValue: null,
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		designation: {
			type: DataTypes.STRING(255),
			allowNull: true,
			defaultValue: null,
		},
		sign_method: {
			type: DataTypes.ENUM('DRAW', 'OTP'),
			allowNull: false,
			defaultValue: 'DRAW',
		},
		signature_data: {
			type: DataTypes.TEXT,
			allowNull: true,
			defaultValue: null,
		},
		otp_verified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		signed_at: {
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
		tableName: 'survey_signoffs',
		timestamps: true,
		paranoid: true,
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at',
	}
);

export default SurveySignoff;
