import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface IndustryAttributes {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface IndustryCreationAttributes extends Optional<IndustryAttributes, 'id' | 'is_active'> {}

class Industry extends Model<IndustryAttributes, IndustryCreationAttributes> implements IndustryAttributes {
  public id!: string;
  public name!: string;
  public is_active!: boolean;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date;
}

(Industry as any).init(
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
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
    sequelize,
    tableName: 'ref_industries',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Industry;
