import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface LevelRecommendationAttributes {
  id: string;
  worker_id: string;
  company_id: string;
  course_level_id: string;
  recommended_by_id: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_comment?: string;
  approved_by_admin_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface LevelRecommendationCreationAttributes extends Optional<LevelRecommendationAttributes, 'id' | 'status'> {}

class LevelRecommendation extends Model<LevelRecommendationAttributes, LevelRecommendationCreationAttributes> implements LevelRecommendationAttributes {
  public id!: string;
  public worker_id!: string;
  public company_id!: string;
  public course_level_id!: string;
  public recommended_by_id!: string;
  public reason!: string;
  public status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  public admin_comment!: string;
  public approved_by_admin_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(LevelRecommendation as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    worker_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    course_level_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    recommended_by_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    admin_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'level_recommendations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default LevelRecommendation;