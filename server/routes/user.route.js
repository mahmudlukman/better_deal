import express from 'express';
import {
  activateUser,
  createUser,
  deleteUser,
  deleteUsers,
  findAllUsers,
  findUser,
  getUser,
  loginUser,
  logout,
  updateAvatar,
  updateUserAddresses,
  updateUserInfo,
  updateUserPassword,
} from '../controller/user.js';
import { isAdmin, isAuthenticated } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/create-user', createUser);
userRouter.post('/activation', activateUser);
userRouter.post('/login-user', loginUser);
userRouter.get('/user-info/:id', findUser);
userRouter.get(
  '/admin-all-users',
  isAuthenticated,
  isAdmin('Admin'),
  findAllUsers
);
userRouter.delete(
  '/delete-user/:id',
  isAuthenticated,
  isAdmin('Admin'),
  deleteUsers
);
userRouter.get('/logout', logout);
userRouter.get('/getuser', isAuthenticated, getUser);
userRouter.patch('/update-user-info', isAuthenticated, updateUserInfo);
userRouter.patch('/update-avatar', isAuthenticated, updateAvatar);
userRouter.patch(
  '/update-user-addresses',
  isAuthenticated,
  updateUserAddresses
);
userRouter.delete('/delete-user-address/:id', isAuthenticated, deleteUser);
userRouter.patch('/update-user-password', isAuthenticated, updateUserPassword);

export default userRouter;
