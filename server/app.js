import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';
import userRouter from './routes/user.route.js';
import errorMiddleware from './middleware/error.js';

const app = express();

// app.use(cors({
//   origin: ['https://eshop-tutorial-pyri.vercel.app',],
//   credentials: true
// }));
app.use(cors({
  origin: ['https://localhost:3000',],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use("/", express.static("uploads"))
app.use('/test', (req, res) => {
  res.send('Hello world!');
});

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use('api/v2/user', userRouter);

// config
if (process.env.NODE_ENV !== 'PRODUCTION') {
  dotenv.config({
    path: 'server/.env',
  });
}

// it's for ErrorHandling
app.use(errorMiddleware);
export default app;
