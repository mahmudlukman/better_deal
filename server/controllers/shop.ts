import { NextFunction, Request, Response } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncErrors';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ShopModel, { IShop } from '../models/shop';
import ErrorHandler from '../utils/ErrorHandler';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import cloudinary from 'cloudinary';
import { accessTokenOptions, refreshTokenOptions, sendToken } from '../utils/jwtToken';
import { redis } from '../utils/redis';

// create shop
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar: object;
  address: string;
  phoneNumber: string;
  zipCode?: string;
}

// create shop
export const createShop = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avatar, address, phoneNumber, zipCode } =
        req.body;

      const isShopExist = await ShopModel.findOne({ email });
      if (isShopExist) {
        return next(new ErrorHandler('Shop already exist', 400));
      }

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
      });

      const seller: IRegistrationBody = {
        name,
        email,
        password,
        avatar: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
        address,
        phoneNumber,
        zipCode,
      };
      const activationToken = createActivationToken(seller);

      const activationCode = activationToken.activationCode;

      const data = { seller: { name: seller.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/shop-activation-mail.ejs'),
        data
      );

      try {
        await sendMail({
          email: seller.email,
          subject: 'Activate your shop',
          template: 'shop-activation-mail.ejs',
          data,
        });
        res.status(201).json({
          success: true,
          message: `Please check your email: ${seller.email} to activate your shop!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

// create activation token
export const createActivationToken = (seller: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      seller,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: '5m',
    }
  );
  return { token, activationCode };
};

// activate shop
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

// activate user
export const activateShop = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newSeller: { seller: IShop; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { seller: IShop; activationCode: string };

      if (newSeller.activationCode !== activation_code) {
        return next(new ErrorHandler('Invalid activation code', 400));
      }
      const { name, email, password, avatar, address, phoneNumber, zipCode } =
        newSeller.seller;

      const isShopExist = await ShopModel.findOne({ email });

      if (isShopExist) {
        return next(new ErrorHandler('Email already exist', 400));
      }
      const seller = await ShopModel.create({
        name,
        email,
        password,
        avatar,
        address,
        phoneNumber,
        zipCode,
      });
      res.status(201).json({ success: true });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Login shop
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginShop = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400));
      }
      const seller = await ShopModel.findOne({ email }).select('+password');

      if (!seller) {
        return next(new ErrorHandler('Invalid credentials', 400));
      }

      const isPasswordMatch = await seller.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler('Invalid credentials', 400));
      }
      sendToken(seller, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const logoutShop = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('seller_token', '', { maxAge: 1 });
      const shopId = req.user?._id || '';
      redis.del(shopId);
      res
        .status(200)
        .json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update access token
export const updateAccessToken = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if th user is a seller
      if (req.user?.role !== 'seller') {
        return next(new ErrorHandler('Unauthorized access', 403));
      }

      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      const message = 'Could not refresh token';
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = await redis.get(decoded.id as string);

      if (!session) {
        return next(
          new ErrorHandler('Please login to access this resource', 400)
        );
      }
      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: '5m' }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: '3d' }
      );

      req.user = user;

      res.cookie('access_token', accessToken, accessTokenOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenOptions);

      await redis.set(user._id, JSON.stringify(user), 'EX', 604800); // 7 days

      res.status(200).json({ status: 'success', accessToken });
      // next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
