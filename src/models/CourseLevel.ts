import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface CourseLevelAttributes {
  id: string;
  course_id: string;
  level_number: number;
  title: string;
  description?: string;
  fast_track_experience_required?: number;
  completion_window_days: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface CourseLevelCreationAttributes extends Optional<CourseLevelAttributes, 'id'> {}

class CourseLevel extends Model<CourseLevelAttributes, CourseLevelCreationAttributes> implements CourseLevelAttributes {
  public id!: string;
  public course_id!: string;
  public level_number!: number;
  public title!: string;
  public description!: string;
  public fast_track_experience_required!: number;
  public completion_window_days!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(CourseLevel as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    level_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 4 }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fast_track_experience_required: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    completion_window_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    }
  },
  {
    sequelize,
    tableName: 'course_levels',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        fields: ['course_id', 'level_number']
      }
    ]
  }
);

export default CourseLevel;