import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface OrderAttributes {
  id: string;
  user_id: string;
  company_id?: string;
  total_amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  created_at?: Date;
  updated_at?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'company_id' | 'currency' | 'status'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public user_id!: string;
  public company_id!: string;
  public total_amount!: number;
  public currency!: string;
  public status!: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(Order as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Order;