import { catchAsyncError } from './catchAsyncErrors.js';
import jwt from 'jsonwebtoken';
import ErrorHandler from '../utils/ErrorHandler.js';

// authenticated user
export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    return next(new ErrorHandler('Please login to access this resources', 400));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  if (!decoded) {
    return next(new ErrorHandler('Access token is not valid', 400));
  }

  req.user = await User.findById(decoded.id);

  next();
});

export const isSeller = (...roles) => {
  (
    async (req, res, next) => {
      const { seller_token } = req.cookies;
      if (!seller_token) {
        return next(new ErrorHandler('Please login to continue', 401));
      }

      const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);

      req.seller = await Shop.findById(decoded.id);

      next();
    }
  );
}

// validate user role
export const isAdmin = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resources`,
          403
        )
      );
    }
    next();
  };
};
