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
} from '../utils/jwt';
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

      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: 'avatars',
      });

      const user = {
        name: name,
        email: email,
        password: password,
        avatar: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
      };

      const activationToken = createActivationToken(user);

      const activationUrl = `https://localhost:3000/activation/${activationToken}`;

      try {
        await sendMail({
          email: user.email,
          subject: 'Activate your account',
          message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
        });
        res.status(201).json({
          success: true,
          message: `please check your email:- ${user.email} to activate your account!`,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
}

// create activation token
const createActivationToken = (user: any): IActivationToken => {
  const token = jwt.sign(user, process.env.ACTIVATION_SECRET as Secret, {
    expiresIn: '5m',
  });
  return { token };
};

// activate user
interface IActivationRequest {
  activation_token: string;
}

// activate user
export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token } = req.body as IActivationRequest;

      const newUser: {user: IUser} = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser };

      if (!newUser) {
        return next(new ErrorHandler('Invalid token', 400));
      }
      const { name, email, password } = newUser.user;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler('User already exists', 400));
      }
      user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// login user
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler('Please provide the all fields!', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorHandler("User doesn't exists!", 400));
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return next(
        new ErrorHandler('Please provide the correct information', 400)
      );
    }

    sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// load user
export const getUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorHandler("User doesn't exists", 400));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// log out user
export const logout = catchAsyncErrors(async (req, res, next) => {
  try {
    res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    res.status(201).json({
      success: true,
      message: 'Log out successful!',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update user info
export const updateUserInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password, phoneNumber, name } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorHandler('User not found', 400));
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return next(
        new ErrorHandler('Please provide the correct information', 400)
      );
    }

    user.name = name;
    user.email = email;
    user.phoneNumber = phoneNumber;

    await user.save();

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update user avatar
export const updateAvatar = catchAsyncErrors(async (req, res, next) => {
  try {
    let existsUser = await User.findById(req.user.id);
    if (req.body.avatar !== '') {
      const imageId = existsUser.avatar.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
      });

      existsUser.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    await existsUser.save();

    res.status(200).json({
      success: true,
      user: existsUser,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update user addresses
export const updateUserAddresses = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    const sameTypeAddress = user.addresses.find(
      (address) => address.addressType === req.body.addressType
    );
    if (sameTypeAddress) {
      return next(
        new ErrorHandler(`${req.body.addressType} address already exists`)
      );
    }

    const existsAddress = user.addresses.find(
      (address) => address._id === req.body._id
    );

    if (existsAddress) {
      Object.assign(existsAddress, req.body);
    } else {
      // add the new address to the array
      user.addresses.push(req.body);
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// delete user address
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    await User.updateOne(
      {
        _id: userId,
      },
      { $pull: { addresses: { _id: addressId } } }
    );

    const user = await User.findById(userId);

    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// update user password
export const updateUserPassword = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler('Old password is incorrect!', 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(
        new ErrorHandler("Password doesn't matched with each other!", 400)
      );
    }
    user.password = req.body.newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// find user information with the userId
export const findUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// all users --- for admin
export const findAllUsers = catchAsyncErrors(async (req, res, next) => {
  try {
    const users = await User.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// delete users --- admin
export const deleteUsers = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorHandler('User is not available with this id', 400));
    }

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    await User.findByIdAndDelete(req.params.id);

    res.status(201).json({
      success: true,
      message: 'User deleted successfully!',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
