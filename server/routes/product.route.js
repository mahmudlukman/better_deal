import express from 'express';
import {
  createProduct,
  deleteProductInShop,
  getAllProducts,
  getAllProductsInShop,
  reviewProduct,
} from '../controllers/product.js';
import { isSeller, isAuthenticated } from '../middleware/auth.js';

const productRouter = express.Router();

productRouter.post('/create-product', createProduct);
productRouter.get('/get-all-products-shop/:id', getAllProductsInShop);
productRouter.delete('/delete-shop-product/:id', isSeller, deleteProductInShop);
productRouter.get('/get-all-products', getAllProducts);
productRouter.put('/review-product', isAuthenticated, reviewProduct);

export default productRouter;
