import express from "express";
import {activateUser, register} from '../controller/user.js'

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/activation", activateUser);

export default userRouter;
