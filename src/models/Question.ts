import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface QuestionAttributes {
  id: string;
  content_item_id: string;
  text: string;
  type: 'MCQ' | 'TEXT';
  points: number;
  sequence_order: number;
  created_at?: Date;
  updated_at?: Date;
}

interface QuestionCreationAttributes extends Optional<QuestionAttributes, 'id' | 'points' | 'sequence_order'> {}

class Question extends Model<QuestionAttributes, QuestionCreationAttributes> implements QuestionAttributes {
  public id!: string;
  public content_item_id!: string;
  public text!: string;
  public type!: 'MCQ' | 'TEXT';
  public points!: number;
  public sequence_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(Question as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('MCQ', 'TEXT'),
      defaultValue: 'MCQ',
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    sequence_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    }
  },
  {
    sequelize,
    tableName: 'questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Question;