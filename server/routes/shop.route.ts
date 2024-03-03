import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { createShop } from '../controllers/shop';

const shopRouter = express.Router();

shopRouter.post('/create-shop', createShop);

export default shopRouter;
