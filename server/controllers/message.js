import Messages from '../models/Message.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import { catchAsyncError } from '../middleware/catchAsyncErrors.js';
import cloudinary from 'cloudinary';

// create new message
export const createNewMessage = catchAsyncError(async (req, res, next) => {
  try {
    const messageData = req.body;

    if (req.body.images) {
      const myCloud = await cloudinary.v2.uploader.upload(req.body.images, {
        folder: 'messages',
      });
      messageData.images = {
        public_id: myCloud.public_id,
        url: myCloud.url,
      };
    }

    messageData.conversationId = req.body.conversationId;
    messageData.sender = req.body.sender;
    messageData.text = req.body.text;

    const message = new Messages({
      conversationId: messageData.conversationId,
      text: messageData.text,
      sender: messageData.sender,
      images: messageData.images ? messageData.images : undefined,
    });

    await message.save();

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message), 500);
  }
});

// get all messages with conversation id
export const getAllMessages = catchAsyncError(async (req, res, next) => {
  try {
    const messages = await Messages.find({
      conversationId: req.params.id,
    });

    res.status(201).json({
      success: true,
      messages,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message), 500);
  }
});
