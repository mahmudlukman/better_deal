import jwt from 'jsonwebtoken';
import sendMail from '../utils/sendMail';
import sendToken from '../utils/jwtToken';
import cloudinary from 'cloudinary';
import ErrorHandler from '../utils/ErrorHandler';
import { catchAsyncError } from '../middleware/catchAsyncErrors';
import User from '../models/User';

export const createUser = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      return next(new ErrorHandler('User already exists', 400));
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: 'avatars',
      width: 150,
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
});

// create activation token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: '5m',
  });
};

// activate user
export const activateUser = catchAsyncError(async (req, res, next) => {
  try {
    const { activation_token } = req.body;

    const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);

    if (!newUser) {
      return next(new ErrorHandler('Invalid token', 400));
    }
    const { name, email, password, avatar } = newUser;

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
    return next(new ErrorHandler(error.message, 400));
  }
});

// Login user
export const loginUser = catchAsyncError(async (req, res, next) => {
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
    return next(new ErrorHandler(error.message, 400));
  }
});

export const logoutUser = catchAsyncError(async (req, res, next) => {
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
    return next(new ErrorHandler(error.message, 400));
  }
});

// get user info
export const getUserInfo = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const user = User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User doesn't exists", 400));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user info
export const updateUserInfo = catchAsyncError(async (req, res, next) => {
  try {
    const { email, phoneNumber, name } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (email && user) {
      const isEmailExist = await User.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler('Email already exist', 400));
      }
      user.email = email;
    }

    if (name && user) {
      user.name = name;
    }

    if (phoneNumber && user) {
      user.phoneNumber = phoneNumber;
    }

    await user?.save();

    res.status(201).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user password
export const updatePassword = catchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler('Please enter old and new password', 400));
    }

    const user = await User.findById(userId).select('+password');

    if (user?.password === undefined) {
      return next(new ErrorHandler('Invalid user', 400));
    }

    const isPasswordMatch = await user?.comparePassword(oldPassword);

    if (!isPasswordMatch) {
      return next(new ErrorHandler('Invalid old password', 400));
    }

    user.password = newPassword;

    await user.save();

    res.status(201).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user profile picture
export const updateUserAvatar = catchAsyncError(async (req, res, next) => {
  try {
    const { avatar } = req.body;

    const userId = req.user?._id;

    const user = await User.findById(userId);

    if (avatar && user) {
      // if user have one avatar then call this if
      if (user?.avatar?.public_id) {
        // first delete the old image
        await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: 'avatars',
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      } else {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: 'avatars',
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
    }

    await user?.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user address
export const updateUserAddress = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const user = await User.findById(userId);

    const sameTypeAddress = user?.addresses.find(
      (address) => address.addressType === req.body.addressType
    );
    if (sameTypeAddress) {
      return next(
        new ErrorHandler(`${req.body.addressType} address already exists`, 400)
      );
    }

    const existsAddress = user?.addresses.find(
      (address) => address._id === req.body._id
    );

    if (existsAddress) {
      Object.assign(existsAddress, req.body);
    } else {
      // add the new address to the array
      user?.addresses.push(req.body);
    }

    await user?.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user address
export const deleteUserAddress = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id;
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
    return next(new ErrorHandler(error.message, 400));
  }
});

// get all users --- only for admin
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  try {
    const users = await User.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user role --- only for admin
export const updateUserRole = catchAsyncError(async (req, res, next) => {
  try {
    const { id, role } = req.body;
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });

    res.status(201).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Delete user --- only for admin
export const deleteUser = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return next(new ErrorHandler('User is not available with this id', 404));
    }

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    await user.deleteOne({ id });

    res.status(201).json({
      success: true,
      message: 'User deleted successfully!',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
