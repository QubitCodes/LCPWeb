import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

export enum ProgressStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

interface ContentProgressAttributes {
  id: string;
  worker_id: string;
  enrollment_id: string;
  content_item_id: string;
  status: ProgressStatus;
  watch_percentage: number;
  quiz_score?: number;
  attempts_count: number;
  last_accessed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface ContentProgressCreationAttributes extends Optional<ContentProgressAttributes, 'id' | 'status' | 'watch_percentage' | 'attempts_count'> {}

class ContentProgress extends Model<ContentProgressAttributes, ContentProgressCreationAttributes> implements ContentProgressAttributes {
  public id!: string;
  public worker_id!: string;
  public enrollment_id!: string;
  public content_item_id!: string;
  public status!: ProgressStatus;
  public watch_percentage!: number;
  public quiz_score!: number;
  public attempts_count!: number;
  public last_accessed_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(ContentProgress as any).init(
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
    enrollment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ProgressStatus)),
      defaultValue: ProgressStatus.LOCKED,
    },
    watch_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 }
    },
    quiz_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    attempts_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_accessed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    tableName: 'content_progress',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['enrollment_id', 'content_item_id']
      }
    ]
  }
);

export default ContentProgress;