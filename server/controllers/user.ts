require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from '../utils/jwtToken';
import { redis } from '../utils/redis';
import {
  getAllUsersService,
  getUserById,
  updateUserRoleService,
} from '../services/user.service';
import cloudinary from 'cloudinary';
import ErrorHandler from '../utils/ErrorHandler';
import { catchAsyncError } from '../middleware/catchAsyncErrors';
import UserModel, { IUser } from '../models/user';

// register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const isEmailExist = await UserModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler('Email already exist', 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/activation-mail.ejs'),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: 'Activate your account',
          template: 'activation-mail.ejs',
          data,
        });
        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account!`,
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
export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: '5m',
    }
  );
  return { token, activationCode };
};

// activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

// activate user
export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler('Invalid activation code', 400));
      }
      const { name, email, password } = newUser.user;

      const existUser = await UserModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler('Email already exist', 400));
      }
      const user = await UserModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({ success: true });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400));
      }
      const user = await UserModel.findOne({ email }).select('+password');

      if (!user) {
        return next(new ErrorHandler('Invalid credentials', 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler('Invalid credentials', 400));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const logoutUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('access_token', '', { maxAge: 1 });
      res.cookie('refresh_token', '', { maxAge: 1 });
      const userId = req.user?._id || '';
      redis.del(userId);
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

      // req.user = user;

      res.cookie('access_token', accessToken, accessTokenOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenOptions);

      // await redis.set(user._id, JSON.stringify(user), 'EX', 604800); // 7 days

      res.status(200).json({ status: 'success', accessToken });
      // next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get user info
export const getUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// // update user avatar
// export const updateAvatar = catchAsyncErrors(async (req, res, next) => {
//   try {
//     let existsUser = await User.findById(req.user.id);
//     if (req.body.avatar !== '') {
//       const imageId = existsUser.avatar.public_id;

//       await cloudinary.v2.uploader.destroy(imageId);

//       const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//         folder: 'avatars',
//         width: 150,
//       });

//       existsUser.avatar = {
//         public_id: myCloud.public_id,
//         url: myCloud.secure_url,
//       };
//     }

//     await existsUser.save();

//     res.status(200).json({
//       success: true,
//       user: existsUser,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

// // update user addresses
// export const updateUserAddresses = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.id);

//     const sameTypeAddress = user.addresses.find(
//       (address) => address.addressType === req.body.addressType
//     );
//     if (sameTypeAddress) {
//       return next(
//         new ErrorHandler(`${req.body.addressType} address already exists`)
//       );
//     }

//     const existsAddress = user.addresses.find(
//       (address) => address._id === req.body._id
//     );

//     if (existsAddress) {
//       Object.assign(existsAddress, req.body);
//     } else {
//       // add the new address to the array
//       user.addresses.push(req.body);
//     }

//     await user.save();

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

// // delete user address
// export const deleteUser = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const addressId = req.params.id;

//     await User.updateOne(
//       {
//         _id: userId,
//       },
//       { $pull: { addresses: { _id: addressId } } }
//     );

//     const user = await User.findById(userId);

//     res.status(200).json({ success: true, user });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

// // update user password
// export const updateUserPassword = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.id).select('+password');

//     const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

//     if (!isPasswordMatched) {
//       return next(new ErrorHandler('Old password is incorrect!', 400));
//     }

//     if (req.body.newPassword !== req.body.confirmPassword) {
//       return next(
//         new ErrorHandler("Password doesn't matched with each other!", 400)
//       );
//     }
//     user.password = req.body.newPassword;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Password updated successfully!',
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

// // find user information with the userId
// export const findUser = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id);

//     res.status(201).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

// // all users --- for admin
// export const findAllUsers = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const users = await User.find().sort({
//       createdAt: -1,
//     });
//     res.status(201).json({
//       success: true,
//       users,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

// // delete users --- admin
// export const deleteUsers = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return next(new ErrorHandler('User is not available with this id', 400));
//     }

//     const imageId = user.avatar.public_id;

//     await cloudinary.v2.uploader.destroy(imageId);

//     await User.findByIdAndDelete(req.params.id);

//     res.status(201).json({
//       success: true,
//       message: 'User deleted successfully!',
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });
