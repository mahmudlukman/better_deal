import express from "express"
import User from "../model/user"
import { upload } from "../multer"
import { catchAsyncError } from "../middleware/catchAsyncErrors"

export const register = catchAsyncError(async (req, res, next) => {
  
})