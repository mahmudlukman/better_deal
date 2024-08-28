import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { createOrder } from '../controllers/Order';

const orderRouter = express.Router();

orderRouter.post('/create-order', createOrder);

export default orderRouter;
