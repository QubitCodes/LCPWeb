import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface JobAttributes {
  id: number;
  name: string;
  category_id: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface JobCreationAttributes extends Optional<JobAttributes, 'id'> { }

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: number;
  public name!: string;
  public category_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(Job as any).init(
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ref_jobs',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Job;