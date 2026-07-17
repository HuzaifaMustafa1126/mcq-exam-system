import { body, validationResult } from 'express-validator';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const handleValidationErrors = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors.array()));
  }

  return next();
};

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage('Password is required and must not exceed 128 characters'),
  handleValidationErrors,
];
