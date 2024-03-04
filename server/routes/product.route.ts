import express from 'express';
import {
  createProduct,
  deleteProductInShop,
  getAllProducts,
  getAllProductsInShop,
  reviewProduct,
} from '../controllers/product';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const productRouter = express.Router();

productRouter.post('/create-product', createProduct);
productRouter.get('/get-all-products-shop/:id', getAllProductsInShop);
productRouter.delete('/delete-shop-product/:id', authorizeRoles("seller"), deleteProductInShop);
productRouter.get('/get-all-products', getAllProducts);
productRouter.put('/review-product', isAuthenticated, reviewProduct);

export default productRouter;
