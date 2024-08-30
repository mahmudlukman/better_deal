import { catchAsyncError } from '../middleware/catchAsyncErrors';
import Shop from '../model/shop';
import Event from '../model/event';
import ErrorHandler from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';

// create event
export const createEvent = catchAsyncError(async (req, res, next) => {
  try {
    const shopId = req.body.shopId;
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return next(new ErrorHandler('Shop Id is invalid!', 400));
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

      const event = await Event.create(productData);

      res.status(201).json({
        success: true,
        event,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// get all events
export const getEvents = catchAsyncError(async (req, res, next) => {
  try {
    const events = await Event.find();
    res.status(201).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// get all events of a shop
export const getShopEvents = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const events = await Event.find({ shopId: id });

    res.status(201).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// delete event of a shop
export const deleteShopEvent = catchAsyncError(async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!product) {
      return next(new ErrorHandler('Product is not found with this id', 404));
    }

    for (let i = 0; 1 < product.images.length; i++) {
      const result = await cloudinary.v2.uploader.destroy(
        event.images[i].public_id
      );
    }

    await event.remove();

    res.status(201).json({
      success: true,
      message: 'Event Deleted successfully!',
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

// all events --- for admin
export const getAllEvents = catchAsyncError(async (req, res, next) => {
  try {
    const events = await Event.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
