import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface OrderItemAttributes {
  id: string;
  order_id: string;
  worker_id: string;
  course_level_id: string;
  price: number;
  created_at?: Date;
  updated_at?: Date;
}

interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id'> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: string;
  public order_id!: string;
  public worker_id!: string;
  public course_level_id!: string;
  public price!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(OrderItem as any).init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    worker_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    course_level_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default OrderItem;