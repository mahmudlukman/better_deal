import { catchAsyncError } from '../middleware/catchAsyncErrors';
import jwt from 'jsonwebtoken';
import Shop from '../models/Shop';
import ErrorHandler from '../utils/ErrorHandler';
import sendMail from '../utils/sendMail';
import cloudinary from 'cloudinary';
import sendShopToken from '../utils/shopToken';

// create shop
export const createShop = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password, avatar, address, phoneNumber, zipCode } =
      req.body;

    const isShopExist = await Shop.findOne({ email });
    if (isShopExist) {
      return next(new ErrorHandler('Shop already exist', 400));
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: 'avatars',
      width: 150,
    });

    const seller = {
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

    const activationUrl = `https://localhost:3000/seller/activation/${activationToken}`;

    try {
      await sendMail({
        email: seller.email,
        subject: 'Activate your Shop',
        message: `Hello ${seller.name}, please click on the link to activate your shop: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${seller.email} to activate your shop!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// create activation token
export const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
    expiresIn: '5m',
  });
};

// activate user
export const activateShop = catchAsyncError(async (req, res, next) => {
  try {
    const { activation_token } = req.body;

    const newSeller = jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET
    );

    if (!newSeller) {
      return next(new ErrorHandler('Invalid token', 400));
    }
    const { name, email, password, avatar, address, phoneNumber, zipCode } =
      newSeller.seller;

    const isShopExist = await Shop.findOne({ email });

    if (isShopExist) {
      return next(new ErrorHandler('Email already exist', 400));
    }
    const seller = await Shop.create({
      name,
      email,
      password,
      avatar,
      address,
      phoneNumber,
      zipCode,
    });

    sendShopToken(seller, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Login shop
export const loginShop = catchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler('Please enter email and password', 400));
    }
    const shop = await Shop.findOne({ email }).select('+password');

    if (!shop) {
      return next(new ErrorHandler('Invalid credentials', 400));
    }

    const isPasswordMatch = await shop.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new ErrorHandler('Invalid credentials', 400));
    }
    sendShopToken(shop, 200, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const logoutShop = catchAsyncError(async (req, res, next) => {
  try {
    res.cookie('seller_token', null, {
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

// get seller info
export const getSeller = catchAsyncError(async (req, res, next) => {
  try {
    const sellerId = req.seller?._id;

    const seller = await Shop.findById(sellerId);

    if (!seller) {
      return next(new ErrorHandler('Seller information not found', 400));
    }

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Update Seller info
export const updateSellerInfo = catchAsyncError(async (req, res, next) => {
  try {
    const { name, description, address, phoneNumber, zipCode } = req.body;
    const sellerId = req.seller?._id;
    const shop = await Shop.findById(sellerId);

    if (name) shop.name = name;
    if (phoneNumber) shop.phoneNumber = phoneNumber;
    if (description) shop.description = description;
    if (address) shop.address = address;
    if (zipCode) shop.zipCode = zipCode;

    await shop?.save();

    res.status(201).json({ success: true, shop });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get shop info
export const getShopInfo = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id);

    if (!shop) {
      return next(new ErrorHandler('Shop information not found', 400));
    }

    res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const updateShopPassword = catchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const sellerId = req.seller?._id;

    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler('Please enter old and new password', 400));
    }

    const shop = await Shop.findById(sellerId).select('+password');

    if (shop?.password === undefined) {
      return next(new ErrorHandler('Invalid shop', 400));
    }

    const isPasswordMatch = await shop?.comparePassword(oldPassword);

    if (!isPasswordMatch) {
      return next(new ErrorHandler('Invalid old password', 400));
    }

    shop.password = newPassword;

    await shop.save();

    res
      .status(201)
      .json({ success: true, message: 'Password Updated Successfully' });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// update user profile picture
export const updateShopAvatar = catchAsyncError(async (req, res, next) => {
  try {
    const { avatar } = req.body;

    const sellerId = req.seller?._id;

    const shop = await Shop.findById(sellerId);

    if (avatar && shop) {
      if (shop?.avatar?.public_id) {
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

    res.status(200).json({ success: true, shop });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get all shops --- only for admin
export const getAllShops = catchAsyncError(async (req, res, next) => {
  try {
    const shops = await Shop.find().sort({ created: -1 });
    res.status(201).json({
      success: true,
      shops,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//delete user ---only for admin
export const deleteShop = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id);

    if (!shop) {
      return next(new ErrorHandler('Shop not found', 404));
    }

    const imageId = shop.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    await shop.deleteOne({ id });

    res.status(200).json({
      success: true,
      message: 'Shop deleted successfully',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//update seller withdraw methods --- sellers
export const updateWithdrawMethod = catchAsyncError(async (req, res, next) => {
  try {
    // const { id } = req.params;
    const sellerId = req.seller?._id;
    const { withdrawMethod } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      sellerId,
      { withdrawMethod },
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// delete seller withdraw methods --- only seller
export const deleteWithdrawMethod = catchAsyncError(async (req, res, next) => {
  try {
    const sellerId = req.seller?._id;

    const shop = await Shop.findById(sellerId);

    if (!shop) {
      return next(new ErrorHandler('Shop not found with this id', 400));
    }

    shop.withdrawMethod = null;

    await shop.save();

    res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
