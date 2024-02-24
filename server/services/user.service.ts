import { Response } from 'express';
import { redis } from '../utils/redis';
import UserModel from '../model/user';

// get user by id
export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);

  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({ success: true, user });
  }
};

// get All users
export const getAllUsersService = async (res: Response) => {
  const users = await UserModel.find().sort({ created: -1 });

  res.status(201).json({ success: true, users });
};

// update user roles
export const updateUserRoleService = async (
  res: Response,
  id: string,
  role: string
) => {
  const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true });

  res.status(201).json({ success: true, user });
};
