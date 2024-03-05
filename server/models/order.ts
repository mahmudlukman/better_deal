import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './user';

interface IOrderItem {
  _id: string;
  quantity: number;
}

interface IShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface IPaymentInfo {
  id: string;
  status: string;
  type: string;
}

interface IOrder extends Document {
  cart: IOrderItem[];
  shippingAddress: IShippingAddress;
  user: IUser;
  totalPrice: number;
  status: string;
  paymentInfo?: IPaymentInfo;
  paidAt?: Date;
  deliveredAt?: Date;
}

const OrderSchema: Schema<IOrder> = new mongoose.Schema(
  {
    cart: {
      type: [{ _id: String, quantity: Number }],
      required: true,
    },
    shippingAddress: {
      type: Object,
      required: true,
    },
    user: {
      type: Object,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: 'Processing',
    },
    paymentInfo: {
      id: {
        type: String,
      },
      status: {
        type: String,
      },
      type: {
        type: String,
      },
    },
    paidAt: {
      type: Date,
      default: Date.now(),
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const OrderModel: Model<IOrder> = mongoose.model('Order', OrderSchema);

export default OrderModel;
