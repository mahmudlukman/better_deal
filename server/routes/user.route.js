import express from 'express';
import {
  activateUser,
  createUser,
  deleteUser,
  deleteUserAddress,
  getAllUsers,
  getUserById,
  getUserInfo,
  loginUser,
  logoutUser,
  updatePassword,
  updateUserAddress,
  updateUserAvatar,
  updateUserInfo,
  updateUserRole,
} from '../controllers/user';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/create-user', createUser);
userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuthenticated, logoutUser);
userRouter.get('/me', isAuthenticated, getUserInfo);
userRouter.put('/update-user-info', isAuthenticated, updateUserInfo);
userRouter.put('/update-user-password', isAuthenticated, updatePassword);
userRouter.put('/update-user-avatar', isAuthenticated, updateUserAvatar);
userRouter.put('/update-user-address', isAuthenticated, updateUserAddress);
userRouter.delete(
  '/delete-user-address/:id',
  isAuthenticated,
  deleteUserAddress
);
userRouter.get(
  '/get-user/:id',
  getUserById
);
userRouter.get(
  '/get-users',
  isAuthenticated,
  authorizeRoles('admin'),
  getAllUsers
);
userRouter.put(
  '/update-user-role',
  isAuthenticated,
  authorizeRoles('admin'),
  updateUserRole
);

userRouter.delete(
  '/delete-user/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  deleteUser
);

export default userRouter;
