import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * CompanyDetail stores extended company information and onboarding state.
 * One-to-one with Company. The `onboarding_step` field tracks where the
 * company is in the registration flow:
 *   NULL = onboarding complete
 *   2    = company created, needs verification (Step 3)
 *   etc.
 */
interface CompanyDetailAttributes {
    id: string;
    company_id: string;
    onboarding_step: number | null;
    delete_reason?: string | null;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface CompanyDetailCreationAttributes
    extends Optional<CompanyDetailAttributes, 'id' | 'onboarding_step' | 'delete_reason'> { }

class CompanyDetail
    extends Model<CompanyDetailAttributes, CompanyDetailCreationAttributes>
    implements CompanyDetailAttributes {
    declare public id: string;
    declare public company_id: string;
    declare public onboarding_step: number | null;
    declare public delete_reason: string | null;

    declare public readonly created_at: Date;
    declare public readonly updated_at: Date;
    declare public readonly deleted_at: Date;
}

(CompanyDetail as any).init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        onboarding_step: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
            comment: 'NULL = onboarding complete, integer = step to resume',
        },
        delete_reason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'company_details',
        paranoid: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

export default CompanyDetail;
