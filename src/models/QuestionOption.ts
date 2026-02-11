import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface QuestionOptionAttributes {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order: number;
  created_at?: Date;
  updated_at?: Date;
}

interface QuestionOptionCreationAttributes extends Optional<QuestionOptionAttributes, 'id' | 'is_correct' | 'order'> {}

class QuestionOption extends Model<QuestionOptionAttributes, QuestionOptionCreationAttributes> implements QuestionOptionAttributes {
  public id!: string;
  public question_id!: string;
  public text!: string;
  public is_correct!: boolean;
  public order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(QuestionOption as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    }
  },
  {
    sequelize,
    tableName: 'question_options',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default QuestionOption;