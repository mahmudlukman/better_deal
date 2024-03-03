import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { activateShop, createShop } from '../controllers/shop';

const shopRouter = express.Router();

shopRouter.post('/create-shop', createShop);
shopRouter.post('/activate-shop', activateShop);

export default shopRouter;
