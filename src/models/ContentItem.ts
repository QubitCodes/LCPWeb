import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

export enum ContentType {
  VIDEO = 'VIDEO',
  QUESTIONNAIRE = 'QUESTIONNAIRE'
}

interface ContentItemAttributes {
  id: string;
  course_level_id: string;
  title: string;
  type: ContentType;
  sequence_order: number;
  video_url?: string;
  video_duration_seconds?: number;
  min_watch_percentage?: number;
  is_eligibility_check?: boolean;
  is_final_exam?: boolean;
  passing_score?: number;
  retry_threshold?: number;
  max_attempts_allowed?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface ContentItemCreationAttributes extends Optional<ContentItemAttributes, 'id'> {}

class ContentItem extends Model<ContentItemAttributes, ContentItemCreationAttributes> implements ContentItemAttributes {
  public id!: string;
  public course_level_id!: string;
  public title!: string;
  public type!: ContentType;
  public sequence_order!: number;
  public video_url!: string;
  public video_duration_seconds!: number;
  public min_watch_percentage!: number;
  public is_eligibility_check!: boolean;
  public is_final_exam!: boolean;
  public passing_score!: number;
  public retry_threshold!: number;
  public max_attempts_allowed!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(ContentItem as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    course_level_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ContentType)),
      allowNull: false,
    },
    sequence_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    video_duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    min_watch_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 90,
    },
    is_eligibility_check: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_final_exam: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    passing_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    retry_threshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_attempts_allowed: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'content_items',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default ContentItem;