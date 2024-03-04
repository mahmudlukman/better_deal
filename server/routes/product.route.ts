import express from 'express';
import { createProduct, deleteProductInShop, getAllProductsInShop } from '../controllers/product';

const productRouter = express.Router();

productRouter.post('/create-product', createProduct);
productRouter.get('/get-all-products-shop/:id', getAllProductsInShop);
productRouter.delete('/delete-shop-product/:id', deleteProductInShop);

export default productRouter;
