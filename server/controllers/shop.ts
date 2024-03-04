import { NextFunction, Request, Response } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncErrors';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ShopModel, { IShop } from '../models/shop';
import ErrorHandler from '../utils/ErrorHandler';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import cloudinary from 'cloudinary';
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from '../utils/jwtToken';
import { redis } from '../utils/redis';
import UserModel from '../models/user';

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
      next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get seller info
export const getSeller = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;

      // Fetch user information
      const user = await ShopModel.findById(userId);

      // If the user is not found or if it's not a shop, throw an error
      if (!user || user.role !== 'seller') {
        return next(new ErrorHandler('Seller information not found', 400));
      }

      // Fetch shop information based on the user ID
      const shop = await ShopModel.findById(userId);

      // If shop information is not found, throw an error
      if (!shop) {
        return next(new ErrorHandler('Shop information not found', 400));
      }

      // Return the shop information
      res.status(200).json({
        success: true,
        shop,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user info
interface IUpdateUserInfo {
  name?: string;
  phoneNumber?: number;
  address: string;
  zipCode: number;
}

// Update Shop info
export const updateShopInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, phoneNumber, address, zipCode } =
        req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const shop = await ShopModel.findById(userId);

      if (name && shop) {
        shop.name = name;
      }

      if (phoneNumber && shop) {
        shop.phoneNumber = phoneNumber;
      }
      if (address && shop) {
        shop.address = address;
      }
      if (zipCode && shop) {
        shop.zipCode = zipCode;
      }

      await shop?.save();

      await redis.set(userId, JSON.stringify(shop));

      res.status(201).json({ success: true, shop });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user password
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const updateShopPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler('Please enter old and new password', 400));
      }

      const shop = await ShopModel.findById(req.user?._id).select('+password');

      if (shop?.password === undefined) {
        return next(new ErrorHandler('Invalid shop', 400));
      }

      const isPasswordMatch = await shop?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        return next(new ErrorHandler('Invalid old password', 400));
      }

      shop.password = newPassword;

      await shop.save();

      await redis.set(req.user?._id, JSON.stringify(shop));

      res
        .status(201)
        .json({ success: true, message: 'Password Updated Successfully' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user profile picture
interface IUpdateShopAvatar {
  avatar: string;
}

export const updateShopAvatar = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateShopAvatar;

      const userId = req.user?._id;

      const shop = await ShopModel.findById(userId);

      if (avatar && shop) {
        // if user have one avatar then call this if
        if (shop?.avatar?.public_id) {
          // first delete the old image
          await cloudinary.v2.uploader.destroy(shop?.avatar?.public_id);

          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
          });
          shop.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
          });
          shop.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      await shop?.save();

      await redis.set(userId, JSON.stringify(shop));

      res.status(200).json({ success: true, shop });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users --- only for admin
export const getAllShops = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shops = await ShopModel.find().sort({ created: -1 });
      res.status(201).json({
        success: true,
        shops,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//delete user ---only for admin
export const deleteShop = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const shop = await ShopModel.findById(id);
      if (!shop) {
        return next(new ErrorHandler('Shop not found', 404));
      }
      await shop.deleteOne({ id });
      await redis.del(id);
      res.status(200).json({
        success: true,
        message: 'Shop deleted successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//update seller withdraw methods --- sellers
export const updateWithdrawMethod = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { withdrawMethod } = req.body;
      const shop = await ShopModel.findByIdAndUpdate(id, { withdrawMethod });

      res.status(200).json({
        success: true,
        shop,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete seller withdraw methods --- only seller
export const deleteWithdrawMethod = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;

      const shop = await ShopModel.findById(userId);

      if (!shop) {
        return next(new ErrorHandler('Shop not found with this id', 400));
      }

      shop.withdrawMethod = null;

      await shop.save();

      res.status(200).json({
        success: true,
        shop,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
