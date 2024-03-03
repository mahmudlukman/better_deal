require('dotenv').config();
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IShop extends Document {
  name: string;
  email: string;
  password: string;
  description?: string;
  address: string;
  phoneNumber: number;
  role: string;
  avatar: {
    public_id: string;
    url: string;
  };
  zipCode: number;
  withdrawMethod?: object;
  availableBalance: number;
  transactions: ITransactions[];
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

interface ITransactions {
  _id: any;
  amount: number;
  status: string;
}

const TransactionsSchema: Schema<ITransactions> = new mongoose.Schema(
  {
    amount: {
      type: Number,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

const ShopSchema: Schema<IShop> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name!'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email!'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please enter your password'],
      minLength: [6, 'Password should be greater than 6 characters'],
      select: false,
    },
    description: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      default: 'seller',
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    zipCode: {
      type: Number,
      required: true,
    },
    withdrawMethod: {
      type: Object,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    transactions: [TransactionsSchema],
  },
  { timestamps: true }
);

// Hash Password before saving
ShopSchema.pre<IShop>('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// sign access token
ShopSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
    expiresIn: '5m',
  });
};

// sign refresh token
ShopSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
    expiresIn: '3d',
  });
};

// compare password
ShopSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const ShopModel: Model<IShop> = mongoose.model('Shop', ShopSchema);

export default ShopModel;
