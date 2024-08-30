import express from 'express';
import { authorizeRoles, isAdmin, isAuthenticated, isSeller } from '../middleware/auth';
import { createOrder, getAllOrder, getAllSellerOrders, getAllUserOrders, orderRefundRequest, orderRefundSuccess, updateOrderStatus } from '../controllers/Order';

const orderRouter = express.Router();

orderRouter.post('/create-order', createOrder);
orderRouter.get('/user-orders/:userId', getAllUserOrders);
orderRouter.get('/seller-orders/:shopId', getAllSellerOrders);
orderRouter.put('/update-order-status/:id', isSeller, updateOrderStatus);
orderRouter.put('/order-refund/:id', orderRefundRequest);
orderRouter.put('/order-refund-success/:id', isSeller, orderRefundSuccess);
orderRouter.get('/all-orders', isAdmin("admin"), getAllOrder);

export default orderRouter;
