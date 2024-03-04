import express from 'express';
import { createProduct, getAllProductsInShop } from '../controllers/product';

const productRouter = express.Router();

productRouter.post('/create-product', createProduct);
productRouter.get('/get-all-products-shop/:id', getAllProductsInShop);

export default productRouter;
