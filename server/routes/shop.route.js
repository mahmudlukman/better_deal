import express from 'express';
import { authorizeRoles, isAdmin, isAuthenticated, isSeller } from '../middleware/auth';
import {
  activateShop,
  createShop,
  deleteShop,
  deleteWithdrawMethod,
  getAllShops,
  getSeller,
  getShopInfo,
  loginShop,
  logoutShop,
  updateSellerInfo,
  updateShopAvatar,
  updateShopInfo,
  updateShopPassword,
  updateWithdrawMethod,
} from '../controllers/shop';

const shopRouter = express.Router();

shopRouter.post('/create-shop', createShop);
shopRouter.post('/activate-shop', activateShop);
shopRouter.post('/login-shop', loginShop);
shopRouter.get('/seller', isSeller, getSeller);
shopRouter.get(
  '/logout-shop',
  isAuthenticated,
  logoutShop
);
shopRouter.get(
  '/shop-info/:id',
  getShopInfo
);
shopRouter.put(
  '/update-seller-info',
  isSeller,
  updateSellerInfo
);
shopRouter.put(
  '/update-shop-password',
  isSeller,
  updateShopPassword
);

shopRouter.put(
  '/update-shop-avatar',
  isSeller,
  updateShopAvatar
);

shopRouter.get(
  '/get-shops',
  isAuthenticated,
  isAdmin('admin'),
  getAllShops
);

shopRouter.delete(
  '/delete-shop/:id',
  isAuthenticated,
  isAdmin('admin'),
  deleteShop
);

shopRouter.put(
  '/update-payment-methods',
  isSeller,
  updateWithdrawMethod
);

shopRouter.delete(
  '/delete-withdraw-method',
  isSeller,
  deleteWithdrawMethod
);

export default shopRouter;
