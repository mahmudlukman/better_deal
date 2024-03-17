import { Request, Response, NextFunction } from 'express'
import {check, validationResult} from 'express-validator'
export const validateUser = [
  check('name').trim().not().isEmpty().withMessage('Name is missing').isLength({min: 3, max: 20}).withMessage('Name must be 3 to 20 characters Long!'),
  check('email').normalizeEmail().isEmail().withMessage('Email is invalid'),
  check('password').trim().not().isEmpty().withMessage("Password is Missing!").isLength({min: 8, max: 20}).withMessage('Password must be 8 to 20 characters Long!'),
  check('avatar').isEmpty().withMessage("You must select an image!"),
]

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const error = validationResult(req).array()
  if(!error.length) return next()

  res.status(400).json({success: false, message: error[0].msg})
}