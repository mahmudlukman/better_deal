import {check, validationResult} from 'express-validator'
export const validateUser = [
  check('name').trim().not().isEmpty().withMessage('Name is missing').isLength({min: 3, max: 20}).withMessage('Name must be 3 to 20 characters Long!'),
  check('email').normalizeEmail().isEmail().withMessage('Email is invalid'),
  check('password').trim().not().isEmpty().withMessage("Password is Missing!").isLength({min: 6, max: 20}).withMessage('Password must be 6 to 20 characters Long!'),
  check('avatar', 'You must select an image.').notEmpty(),
]

export const validate = (req, res, next) => {
  const error = validationResult(req).array()
  if(!error.length) return next()

  res.status(400).json({success: false, message: error[0].msg})
}