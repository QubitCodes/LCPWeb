import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface SystemSettingAttributes {
  key: string;
  value: any;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'description'> {}

class SystemSetting extends Model<SystemSettingAttributes, SystemSettingCreationAttributes> implements SystemSettingAttributes {
  public key!: string;
  public value!: any;
  public description!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SystemSetting.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT, // Fully unconstrained storage (can be parsed as JSON client-side if needed)
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default SystemSetting;
