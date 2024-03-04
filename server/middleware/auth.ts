import { NextFunction, Request, Response } from 'express';
import { catchAsyncError } from './catchAsyncErrors';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from '../utils/redis';
import ErrorHandler from '../utils/ErrorHandler';

// authenticated user
export const isAuthenticated = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    if (!access_token) {
      return next(
        new ErrorHandler('Please login to access this resources', 400)
      );
    }

    const decoded = jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN as string
    ) as JwtPayload;

    if (!decoded) {
      return next(new ErrorHandler('Access token is not valid', 400));
    }

    const user = await redis.get(decoded.id);

    if (!user) {
      return next(
        new ErrorHandler('Please login to access this resource', 400)
      );
    }

    req.user = JSON.parse(user);

    next();
  }
);

// export const isSeller = (...roles: string[]) => {
//   (
//     async (req: Request, res: Response, next: NextFunction) => {
//       const { seller_token } = req.cookies;
//       if (!seller_token) {
//         return next(new ErrorHandler('Please login to continue', 401));
//       }

//       const decoded = jwt.verify(seller_token, process.env.ACCESS_TOKEN);

//       req.seller = await Shop.findById(decoded.id);

//       next();
//     }
//   );
// }

// validate user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || '')) {
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

