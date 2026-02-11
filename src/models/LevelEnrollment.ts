import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface LevelEnrollmentAttributes {
  id: string;
  worker_id: string;
  course_level_id: string;
  start_date: Date;
  deadline_date: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  completion_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface LevelEnrollmentCreationAttributes extends Optional<LevelEnrollmentAttributes, 'id' | 'status'> {}

class LevelEnrollment extends Model<LevelEnrollmentAttributes, LevelEnrollmentCreationAttributes> implements LevelEnrollmentAttributes {
  public id!: string;
  public worker_id!: string;
  public course_level_id!: string;
  public start_date!: Date;
  public deadline_date!: Date;
  public status!: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  public completion_date!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(LevelEnrollment as any).init(
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
    course_level_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deadline_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'FAILED', 'EXPIRED'),
      defaultValue: 'ACTIVE',
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'level_enrollments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default LevelEnrollment;