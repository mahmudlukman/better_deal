import { Response } from 'express';
import { redis } from '../utils/redis';
import ShopModel from '../models/shop';

// get user by id
export const getShopById = async (id: string, res: Response) => {
  const shopJson = await redis.get(id);

  if (shopJson) {
    const shop = JSON.parse(shopJson);
    res.status(201).json({ success: true, shop });
  }
};

// get All users
export const getAllShopsService = async (res: Response) => {
  const users = await ShopModel.find().sort({ created: -1 });

  res.status(201).json({ success: true, users });
};

// update user roles
// export const updateUserRoleService = async (
//   res: Response,
//   id: string,
//   role: string
// ) => {
//   const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true });

//   res.status(201).json({ success: true, user });
// };
