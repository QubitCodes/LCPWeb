import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/sequelize';

interface PaymentAttributes {
  id: string;
  order_id: string;
  provider: 'STRIPE' | 'MANUAL';
  provider_transaction_id?: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proof_document_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public order_id!: string;
  public provider!: 'STRIPE' | 'MANUAL';
  public amount!: number;
  public status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

(Payment as any).init(
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
    provider: {
      type: DataTypes.ENUM('STRIPE', 'MANUAL'),
      allowNull: false,
    },
    provider_transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    proof_document_url: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Payment;