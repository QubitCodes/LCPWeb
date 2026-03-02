import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

import { UserRole } from './enums';
export { UserRole };

/**
 * User account status.
 * - active: Can log in normally
 * - pending: Registered via OTP, awaiting approval
 * - suspended: Account suspended by admin
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

interface UserAttributes {
  id: string;
  email?: string | null;
  firebase_uid?: string | null;
  first_name: string;
  last_name: string;
  role: UserRole;
  status?: UserStatus;
  country_code?: string;
  phone?: string;
  company_id?: string | null;
  years_experience?: number;
  documents?: object;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'email' | 'firebase_uid' | 'status' | 'years_experience' | 'documents'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare public id: string;
  declare public email: string | null;
  declare public firebase_uid: string | null;
  declare public first_name: string;
  declare public last_name: string;
  declare public role: UserRole;
  declare public status: UserStatus;
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
      allowNull: true,
      unique: true,
      validate: {
        isEmailOrNull(value: string | null) {
          if (value !== null && value !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error('Invalid email format');
          }
        }
      },
    },
    firebase_uid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
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
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      allowNull: false,
      defaultValue: UserStatus.ACTIVE,
    },
    country_code: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '+971'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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