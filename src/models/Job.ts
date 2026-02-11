import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface JobAttributes {
  id: string;
  name: string;
  category_id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface JobCreationAttributes extends Optional<JobAttributes, 'id'> {}

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: string;
  public name!: string;
  public category_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(Job as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.UUID,
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