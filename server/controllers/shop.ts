import { NextFunction, Request, Response } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncErrors';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ShopModel from '../models/shop';
import ErrorHandler from '../utils/ErrorHandler';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import cloudinary from 'cloudinary';

// create shop
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
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
      });

      const seller: IRegistrationBody = {
        name,
        email,
        password,
        avatar,
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
