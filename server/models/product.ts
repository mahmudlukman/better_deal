import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './user';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  tags?: string;
  originalPrice?: number;
  discountPrice: number;
  stock: number;
  images: {
    public_id: string;
    url: string;
  }[];
  reviews: IReview[];
  ratings?: number;
  shopId: string;
  shop: object;
  sold_out: number;
  createdAt: Date;
}

export interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  productId: string;
  orderId: string;
}

const ReviewSchema: Schema<IReview> = new mongoose.Schema(
  {
    user: Object,
    rating: {
      type: Number,
      default: 0,
    },
    comment: String,
    productId: String,
  },
  { timestamps: true }
);

const ProductSchema: Schema<IProduct> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your product name!'],
    },
    description: {
      type: String,
      required: [true, 'Please enter your product description!'],
    },
    category: {
      type: String,
      required: [true, 'Please enter your product category!'],
    },
    tags: {
      type: String,
    },
    originalPrice: {
      type: Number,
    },
    discountPrice: {
      type: Number,
      required: [true, 'Please enter your product price!'],
    },
    stock: {
      type: Number,
      required: [true, 'Please enter your product stock!'],
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    reviews: [ReviewSchema],
    ratings: {
      type: Number,
    },
    shopId: {
      type: String,
      required: true,
    },
    shop: {
      type: Object,
      required: true,
    },
    sold_out: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const ProductModel: Model<IProduct> = mongoose.model('Product', ProductSchema);

export default ProductModel;
