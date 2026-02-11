import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface CertificateAttributes {
  id: string;
  worker_id: string;
  enrollment_id: string;
  course_level_id: string;
  certificate_code: string;
  issue_date: Date;
  pdf_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CertificateCreationAttributes extends Optional<CertificateAttributes, 'id' | 'pdf_url'> {}

class Certificate extends Model<CertificateAttributes, CertificateCreationAttributes> implements CertificateAttributes {
  public id!: string;
  public worker_id!: string;
  public enrollment_id!: string;
  public course_level_id!: string;
  public certificate_code!: string;
  public issue_date!: Date;
  public pdf_url!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(Certificate as any).init(
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
      unique: true,
    },
    course_level_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    certificate_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    issue_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    pdf_url: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: 'certificates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Certificate;