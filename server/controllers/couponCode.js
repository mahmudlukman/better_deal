import { catchAsyncError } from '../middleware/catchAsyncErrors.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import CoupounCode from '../models/CouponCode.js';

// create coupoun code
export const createCouponCode = catchAsyncError(async (req, res, next) => {
  try {
    const isCoupounCodeExists = await CoupounCode.find({
      name: req.body.name,
    });

    if (isCoupounCodeExists.length !== 0) {
      return next(new ErrorHandler('Coupoun code already exists!', 400));
    }

    const coupounCode = await CoupounCode.create(req.body);

    res.status(201).json({
      success: true,
      coupounCode,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// get all coupons of a shop
export const getCoupon = catchAsyncError(async (req, res, next) => {
  try {
    const couponCodes = await CoupounCode.find({ shopId: req.seller?.id });
    res.status(201).json({
      success: true,
      couponCodes,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// delete coupon code of a shop
export const deleteCoupon = catchAsyncError(async (req, res, next) => {
  try {
    const couponCode = await CoupounCode.findByIdAndDelete(req.params.id);

    if (!couponCode) {
      return next(new ErrorHandler("Coupon code doesn't exists!", 400));
    }
    res.status(201).json({
      success: true,
      message: 'Coupon code deleted successfully!',
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// get coupon code value by its name
export const getCouponValue = catchAsyncError(async (req, res, next) => {
  try {
    const couponCode = await CoupounCode.findOne({ name: req.params.name });

    res.status(200).json({
      success: true,
      couponCode,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});
