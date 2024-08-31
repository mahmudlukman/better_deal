import express from 'express';
import { isSeller } from '../middleware/auth.js';
import { createCouponCode, deleteCoupon, getCoupon, getCouponValue } from '../controllers/couponCode.js';

const couponCodeRouter = express.Router();

couponCodeRouter.post('/create-coupon-code', isSeller, createCouponCode);
couponCodeRouter.get('/coupon/:id', isSeller, getCoupon);
couponCodeRouter.delete('/delete-coupon/:id', isSeller, deleteCoupon);
couponCodeRouter.get('/get-coupon-value/:name', getCouponValue);

export default couponCodeRouter;
