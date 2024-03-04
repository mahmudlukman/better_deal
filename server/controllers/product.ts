import { NextFunction, Request, Response } from 'express';
import { catchAsyncError } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import ShopModel from '../models/shop';
import cloudinary from 'cloudinary';
import ProductModel from '../models/product';

// create product
export const createProduct = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shopId = req.body.shopId;

      const shop = await ShopModel.findById(shopId);

      if (!shop) {
        return next(new ErrorHandler('Shop Id is invalid', 400));
      } else {
        let images = [];

        if (typeof req.body.images === 'string') {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: 'products',
          });
          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }

        const productData = req.body;
        productData.images = imagesLinks;
        productData.shop = shop;

        const product = await ProductModel.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all products of a shop
export const getAllProductsInShop = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await ProductModel.find({ shopId: req.params.id });
      res.status(201).json({ success: true, products });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete product of a shop
export const deleteProductInShop = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductModel.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler('Product is not found with this id', 404));
      }

      for (let i = 0; 1 < product.images.length; i++) {
        const result = await cloudinary.v2.uploader.destroy(
          product.images[i].public_id
        );
      }

      await product.deleteOne();

      res.status(201).json({
        success: true,
        message: 'Product Deleted successfully!',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all products
export const getAllProducts = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await ProductModel.find().sort({ createdAt: -1 });
      res.status(201).json({ success: true, products });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
