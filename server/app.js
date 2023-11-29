import express from 'express';
import dotenv from 'dotenv'
import ErrorHandler from './utils/ErrorHandler.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';

const app = express();

// app.use(cors({
//   origin: ['https://eshop-tutorial-pyri.vercel.app',],
//   credentials: true
// }));
app.use(cors());

app.use(express.json());
app.use(cookieParser());
app.use("/test", (req, res) => {
  res.send("Hello world!");
});

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use(fileUpload({useTempFiles: true}))


// config
if (process.env.NODE_ENV !== 'PRODUCTION') {
  dotenv.config({
    path: 'server/.env',
  });
}

// it's for ErrorHandling
app.use(ErrorHandler);
export default app;
