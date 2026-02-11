import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface JobSkillAttributes {
  id: string;
  job_id: string;
  skill_id: string;
  difficulty_level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  created_at?: Date;
  updated_at?: Date;
}

interface JobSkillCreationAttributes extends Optional<JobSkillAttributes, 'id'> {}

class JobSkill extends Model<JobSkillAttributes, JobSkillCreationAttributes> implements JobSkillAttributes {
  public id!: string;
  public job_id!: string;
  public skill_id!: string;
  public difficulty_level!: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(JobSkill as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    job_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    skill_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    difficulty_level: {
      type: DataTypes.ENUM('BASIC', 'INTERMEDIATE', 'ADVANCED'),
      defaultValue: 'BASIC',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ref_job_skills',
    timestamps: true,
    paranoid: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default JobSkill;