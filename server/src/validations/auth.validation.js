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

export const updateProfileValidation = [
  body('name').optional().isString().withMessage('Name must be a string')
    .bail().trim().isLength({ min: 2, max: 150 })
    .withMessage('Name must be between 2 and 150 characters'),
  body('email').optional().isString().withMessage('Email must be a string')
    .bail().trim().isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password').optional().isString().withMessage('Password must be a string')
    .bail().isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .bail().custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must not exceed 72 bytes'),
  body().custom((_value, { req }) => {
    if (!['name', 'email', 'password'].some((field) => req.body[field] !== undefined)) {
      throw new Error('At least one profile field must be provided');
    }
    return true;
  }),
  handleValidationErrors,
];
