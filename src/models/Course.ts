import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface CourseAttributes {
  id: string;
  job_id: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'is_active'> {}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: string;
  public job_id!: string;
  public title!: string;
  public description!: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(Course as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    job_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'courses',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Course;