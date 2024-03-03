import mongoose, { Schema, Document } from 'mongoose';
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
  transactions: {
    amount: number;
    status: string;
    createdAt: Date;
    updatedAt?: Date;
  }[];
  resetPasswordToken?: string;
  resetPasswordTime?: Date;
}

const ShopSchema: Schema<IShop> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your shop name!'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your shop email address'],
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
      default: 'Seller',
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
    transactions: [
      {
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          default: 'Processing',
        },
        createdAt: {
          type: Date,
          default: Date.now(),
        },
        updatedAt: {
          type: Date,
        },
      },
    ],
    resetPasswordToken: String,
    resetPasswordTime: Date,
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

const ShopModel = mongoose.model<IShop>('Shop', ShopSchema);

export default ShopModel;
