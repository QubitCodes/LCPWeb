import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

/**
 * CompanySite represents a physical site/location belonging to a company.
 * Each company can have multiple sites.
 * Tracks project stage, duration, and assigned supervisors.
 */
interface CompanySiteAttributes {
    id: string;
    company_id: string;
    name: string;
    address?: string | null;
    /** Current project stage at this site */
    project_stage?: 'FOUNDATION' | 'STRUCTURE' | 'MASONRY' | 'FINISHING' | 'MEP' | null;
    /** Expected duration of the project in months */
    expected_duration_months?: number | null;
    /** FK to users — the contractor/company representative for this site */
    contractor_rep_id?: string | null;
    /** FK to users — the site supervisor / in-charge for this site */
    site_supervisor_id?: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    delete_reason?: string | null;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;
}

interface CompanySiteCreationAttributes
    extends Optional<CompanySiteAttributes, 'id' | 'status' | 'address' | 'project_stage' | 'expected_duration_months' | 'contractor_rep_id' | 'site_supervisor_id' | 'delete_reason'> { }

class CompanySite
    extends Model<CompanySiteAttributes, CompanySiteCreationAttributes>
    implements CompanySiteAttributes {
    declare public id: string;
    declare public company_id: string;
    declare public name: string;
    declare public address: string | null;
    declare public project_stage: 'FOUNDATION' | 'STRUCTURE' | 'MASONRY' | 'FINISHING' | 'MEP' | null;
    declare public expected_duration_months: number | null;
    declare public contractor_rep_id: string | null;
    declare public site_supervisor_id: string | null;
    declare public status: 'ACTIVE' | 'INACTIVE';
    declare public delete_reason: string | null;

    declare public readonly created_at: Date;
    declare public readonly updated_at: Date;
    declare public readonly deleted_at: Date;
}

(CompanySite as any).init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        project_stage: {
            type: DataTypes.ENUM('FOUNDATION', 'STRUCTURE', 'MASONRY', 'FINISHING', 'MEP'),
            allowNull: true,
            defaultValue: null,
            comment: 'Current project stage at this site',
        },
        expected_duration_months: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            comment: 'Expected project duration in months',
        },
        contractor_rep_id: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
            comment: 'FK to users — contractor/company representative',
        },
        site_supervisor_id: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
            comment: 'FK to users — site supervisor / in-charge',
        },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
            allowNull: false,
            defaultValue: 'ACTIVE',
        },
        delete_reason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'company_sites',
        paranoid: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

export default CompanySite;
