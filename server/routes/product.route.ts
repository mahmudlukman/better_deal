import express from 'express';
import {
  createProduct,
  deleteProductInShop,
  getAllProducts,
  getAllProductsInShop,
} from '../controllers/product';
import { authorizeRoles } from '../middleware/auth';

const productRouter = express.Router();

productRouter.post('/create-product', createProduct);
productRouter.get('/get-all-products-shop/:id', getAllProductsInShop);
productRouter.delete('/delete-shop-product/:id', authorizeRoles("seller"), deleteProductInShop);
productRouter.get('/get-all-products', getAllProducts);

export default productRouter;
