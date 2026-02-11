import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface CompanyMembershipHistoryAttributes {
  id: string;
  user_id: string;
  from_company_id?: string | null;
  to_company_id?: string | null;
  effective_date: Date;
  initiated_by_user_id: string;
  reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CompanyMembershipHistoryCreationAttributes extends Optional<CompanyMembershipHistoryAttributes, 'id' | 'reason' | 'from_company_id' | 'to_company_id'> {}

class CompanyMembershipHistory extends Model<CompanyMembershipHistoryAttributes, CompanyMembershipHistoryCreationAttributes> implements CompanyMembershipHistoryAttributes {
  public id!: string;
  public user_id!: string;
  public from_company_id!: string | null;
  public to_company_id!: string | null;
  public effective_date!: Date;
  public initiated_by_user_id!: string;
  public reason!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(CompanyMembershipHistory as any).init(
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
    from_company_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    to_company_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    effective_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    initiated_by_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'company_membership_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default CompanyMembershipHistory;