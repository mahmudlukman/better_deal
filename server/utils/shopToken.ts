require('dotenv').config();
import { Response } from 'express';
import { redis } from './redis';
import { IShop } from '../models/shop';

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: 'lax' | 'strict' | 'none' | undefined;
  secure?: boolean;
}

// parse environment variables to integrates with fallback values
const shopTokenExpire = parseInt(
  process.env.SHOP_TOKEN_EXPIRE || '1200',
  10
);

// options for cookies
export const shopTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + shopTokenExpire * 60 * 60 * 1000),
  maxAge: shopTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
};


export const sendShopToken = (seller: IShop, statusCode: number, res: Response) => {
  const shopToken = seller.SignAccessToken();
  // upload session to redis
  redis.set(seller._id, JSON.stringify(seller) as any);

  // Only set secure to true in production
  if (process.env.NODE_ENV === 'production') {
    shopTokenOptions.secure = true;
  }

  res.status(statusCode).json({
    success: true,
    seller,
  });
};
