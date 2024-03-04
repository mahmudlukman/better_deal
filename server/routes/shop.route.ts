import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import {
  activateShop,
  createShop,
  deleteShop,
  getAllShops,
  getSeller,
  loginShop,
  logoutShop,
  updateShopAvatar,
  updateShopInfo,
  updateShopPassword,
} from '../controllers/shop';
import { updateAccessToken } from '../controllers/user';

const shopRouter = express.Router();

shopRouter.post('/create-shop', createShop);
shopRouter.post('/activate-shop', activateShop);
shopRouter.post('/login-shop', loginShop);
shopRouter.get(
  '/logout-shop',
  isAuthenticated,
  authorizeRoles('seller'),
  logoutShop
);
shopRouter.get('/refresh-shop', updateAccessToken);
shopRouter.get('/my-shop', isAuthenticated, getSeller);
shopRouter.put(
  '/update-shop-info',
  // updateAccessToken,
  isAuthenticated,
  updateShopInfo
);
shopRouter.put(
  '/update-shop-password',
  isAuthenticated,
  updateShopPassword
);

shopRouter.put(
  '/update-shop-avatar',
  isAuthenticated,
  updateShopAvatar
);

shopRouter.get(
  '/get-shops',
  isAuthenticated,
  authorizeRoles('admin'),
  getAllShops
);

shopRouter.delete(
  '/delete-shop/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  deleteShop
);

export default shopRouter;
