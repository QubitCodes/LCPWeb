import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface CompanyAttributes {
  id: string;
  name: string;
  company_id: string; // Renamed from registration_number, auto-generated
  industry_id?: string;
  tax_id?: string;
  address?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documents?: object; // Array of { name: string, url: string }
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'status' | 'approval_status' | 'documents' | 'website' | 'address' | 'tax_id' | 'industry_id'> {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: string;
  public name!: string;
  public company_id!: string;
  public industry_id!: string;
  public tax_id!: string;
  public address!: string;
  public website!: string;
  public contact_email!: string;
  public contact_phone!: string;
  public status!: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  public approval_status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  public documents!: object;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(Company as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    industry_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tax_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true }
    },
    contact_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PENDING'),
      defaultValue: 'PENDING',
    },
    approval_status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    }
  },
  {
    sequelize,
    tableName: 'companies',
    paranoid: true, // Soft delete
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Company;