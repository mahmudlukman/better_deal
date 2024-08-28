import { catchAsyncError } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import Shop from '../models/Shop';
import cloudinary from 'cloudinary';
import Product from '../models/Product';
import Order from '../models/Order';

// create product
export const createProduct = catchAsyncError(
  async (req, res, next) => {
    try {
      const {shopId} = req.body;

      const shop = await Shop.findById(shopId);

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

        const product = await Product.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all products of a shop
export const getAllProductsInShop = catchAsyncError(
  async (req, res, next) => {
    try {
      const {shopId} = req.params
      const products = await Product.find({ shopId });
      res.status(201).json({ success: true, products });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete product of a shop
export const deleteProductInShop = catchAsyncError(
  async (req, res, next) => {
    try {
      const {productId} = req.params
      const product = await Product.findById(productId);

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
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all products -- seller
export const getAllProducts = catchAsyncError(
  async (req, res, next) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.status(201).json({ success: true, products });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// review product
export const reviewProduct = catchAsyncError(
  async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      if (!product) {
        return next(new ErrorHandler('Product not found', 404));
      }

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user?._id
      );

      if (isReviewed) {
        product?.reviews.forEach((rev) => {
          if (rev.user._id === req?.user?._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product?.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      if (product.reviews.length > 0) {
        product.reviews.forEach((rev) => {
          avg += rev.rating;
        });
        product.ratings = avg / product.reviews.length;
      }

      await product.save();

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { 'cart.$[elem].isReviewed': true } },
        { arrayFilters: [{ 'elem._id': productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Reviewed successfully!',
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
