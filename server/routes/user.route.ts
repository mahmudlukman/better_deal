import express from 'express';
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  updateAccessToken,
} from '../controllers/user';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuthenticated, logoutUser);
userRouter.get('/refresh', isAuthenticated, updateAccessToken);
userRouter.get('/me', isAuthenticated, getUserInfo);

export default userRouter;
