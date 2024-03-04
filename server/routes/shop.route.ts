import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { activateShop, createShop, getSeller, getShopInfo, loginShop, logoutShop } from '../controllers/shop';
import { updateAccessToken } from '../controllers/user';

const shopRouter = express.Router();

shopRouter.post('/create-shop', createShop);
shopRouter.post('/activate-shop', activateShop);
shopRouter.post('/login-shop', loginShop);
shopRouter.get('/logout-shop', isAuthenticated, authorizeRoles('seller'), logoutShop);
shopRouter.get('/refresh-shop', authorizeRoles('seller'), updateAccessToken);
shopRouter.get('/my-shop', isAuthenticated, getSeller);
shopRouter.get('/my-shop-info/:id', isAuthenticated, getShopInfo);

export default shopRouter;
