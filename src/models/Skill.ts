import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface SkillAttributes {
  id: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface SkillCreationAttributes extends Optional<SkillAttributes, 'id'> {}

class Skill extends Model<SkillAttributes, SkillCreationAttributes> implements SkillAttributes {
  public id!: string;
  public name!: string;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(Skill as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'ref_skills',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Skill;