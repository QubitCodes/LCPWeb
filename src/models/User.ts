import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

import { UserRole } from './enums';
export { UserRole };

interface UserAttributes {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  country_code?: string;
  phone?: string;
  company_id?: string | null;
  years_experience?: number;
  documents?: object;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'years_experience' | 'documents'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare public id: string;
  declare public email: string;
  declare public password_hash: string;
  declare public first_name: string;
  declare public last_name: string;
  declare public role: UserRole;
  declare public country_code: string;
  declare public phone: string;
  declare public company_id: string | null;
  declare public years_experience: number;
  declare public documents: object;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
  declare public readonly deleted_at: Date;
}

(User as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.WORKER,
    },
    country_code: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '+971'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    years_experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    }
  },
  {
    sequelize,
    tableName: 'users',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default User;