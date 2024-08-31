import express from 'express';
export const app = express();
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middleware/error.js';
import userRouter from './routes/user.route.js';
import shopRouter from './routes/shop.route.js';
import productRouter from './routes/product.route.js';
import orderRouter from './routes/order.route.js';
import messagesRouter from './routes/message.route.js';
import eventRouter from './routes/event.route.js';
import conversationRouter from './routes/conversation.route.js';
import couponCodeRouter from './routes/couponCode.route.js';
import dotenv from 'dotenv';


dotenv.config();

// body parser
app.use(express.json({ limit: '50mb' }));

// cookie parser
app.use(cookieParser());

// cors => Cross Origin Resource Sharing
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);

// routes
app.use(
  '/api/v1',
  userRouter,
  shopRouter,
  productRouter,
  orderRouter,
  messagesRouter,
  eventRouter,
  conversationRouter,
  couponCodeRouter
);

// testing API
app.get('/test', (req, res, next) => {
  res.status(200).json({ success: true, message: 'API is working' });
});

// unknown route
app.all('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

app.use(errorMiddleware);
