import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * Approval status values for user registrations.
 * - pending: Awaiting review
 * - approved_initial: Worker approved initially (more onboarding steps pending)
 * - approved: Fully approved (Supervisors go here directly)
 * - rejected: Registration rejected
 */
export enum ApprovalStatus {
    PENDING = 'pending',
    APPROVED_INITIAL = 'approved_initial',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

interface UserApprovalAttributes {
    id: string;
    user_id: string;
    company_id: string;
    status: ApprovalStatus;
    approved_by?: string | null;
    approved_at?: Date | null;
    comments?: string | null;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
    delete_reason?: string | null;
}

interface UserApprovalCreationAttributes extends Optional<UserApprovalAttributes, 'id' | 'status' | 'approved_by' | 'approved_at' | 'comments' | 'delete_reason'> { }

class UserApproval extends Model<UserApprovalAttributes, UserApprovalCreationAttributes> implements UserApprovalAttributes {
    declare public id: string;
    declare public user_id: string;
    declare public company_id: string;
    declare public status: ApprovalStatus;
    declare public approved_by: string | null;
    declare public approved_at: Date | null;
    declare public comments: string | null;
    declare public readonly created_at: Date;
    declare public readonly updated_at: Date;
    declare public readonly deleted_at: Date | null;
    declare public delete_reason: string | null;
}

(UserApproval as any).init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(ApprovalStatus)),
            allowNull: false,
            defaultValue: ApprovalStatus.PENDING,
        },
        approved_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        comments: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        delete_reason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'user_approvals',
        paranoid: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

export default UserApproval;
