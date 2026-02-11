import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface AuditLogAttributes {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: object;
  ip_address?: string;
  created_at?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public user_id!: string;
  public action!: string;
  public entity_type!: string;
  public entity_id!: string;
  public details!: object;
  public ip_address!: string;
  public readonly created_at!: Date;
}

(AuditLog as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    updatedAt: false,
    paranoid: false,
    timestamps: true,
    createdAt: 'created_at',
  }
);

export default AuditLog;