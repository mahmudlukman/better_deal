import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

import { updateAccessToken } from '../controllers/user';
import { createProduct } from '../controllers/product';

const productRouter = express.Router();

productRouter.post('/create-product', createProduct);

export default productRouter;
