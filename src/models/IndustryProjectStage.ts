import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface IndustryProjectStageAttributes {
  id: number;
  name: string;
  industry_id: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface IndustryProjectStageCreationAttributes extends Optional<IndustryProjectStageAttributes, 'id' | 'is_active'> { }

class IndustryProjectStage extends Model<IndustryProjectStageAttributes, IndustryProjectStageCreationAttributes> implements IndustryProjectStageAttributes {
  public id!: number;
  public name!: string;
  public industry_id!: number;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(IndustryProjectStage as any).init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    industry_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'ref_industry_project_stages',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default IndustryProjectStage;
