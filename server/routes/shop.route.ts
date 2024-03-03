import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { activateShop, createShop, loginShop, logoutShop } from '../controllers/shop';

const shopRouter = express.Router();

shopRouter.post('/create-shop', createShop);
shopRouter.post('/activate-shop', activateShop);
shopRouter.post('/login-shop', loginShop);
shopRouter.get('/logout-shop', isAuthenticated, logoutShop);

export default shopRouter;
