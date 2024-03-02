import express from 'express';
import {
  activateUser,
  deleteUser,
  deleteUserAddress,
  getAllUsers,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  updateAccessToken,
  updatePassword,
  updateProfilePicture,
  updateUserAddress,
  updateUserInfo,
  updateUserRole,
} from '../controllers/user';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuthenticated, logoutUser);
userRouter.get('/refresh', isAuthenticated, updateAccessToken);
userRouter.get('/me', isAuthenticated, getUserInfo);
userRouter.put(
  '/update-user-info',
  updateAccessToken,
  isAuthenticated,
  updateUserInfo
);
userRouter.put(
  '/update-user-password',
  updateAccessToken,
  isAuthenticated,
  updatePassword
);
userRouter.put(
  '/update-user-avatar',
  isAuthenticated,
  updateAccessToken,
  updateProfilePicture
);
userRouter.put('/update-user-address', isAuthenticated, updateUserAddress);
userRouter.delete(
  '/delete-user-address/:id',
  isAuthenticated,
  deleteUserAddress
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
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  deleteUser
);

export default userRouter;
