import { body, param, query, validationResult } from 'express-validator';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const handleValidationErrors = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors.array())
    );
  }

  return next();
};

const nameValidation = body('name')
  .trim()
  .isLength({ min: 2, max: 150 })
  .withMessage('Name must be between 2 and 150 characters');

const emailValidation = body('email')
  .trim()
  .isEmail()
  .withMessage('A valid email address is required')
  .normalizeEmail();

const passwordValidation = body('password')
  .isString()
  .withMessage('Password must be a string')
  .bail()
  .isLength({ min: 8, max: 72 })
  .withMessage('Password must be between 8 and 72 characters')
  .bail()
  .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
  .withMessage('Password must not exceed 72 bytes');

const employeeNumberValidation = body('employeeNumber')
  .trim()
  .notEmpty()
  .withMessage('Employee number is required')
  .bail()
  .isLength({ max: 50 })
  .withMessage('Employee number must not exceed 50 characters');

const departmentValidation = body('department')
  .optional({ values: 'null' })
  .isString()
  .withMessage('Department must be a string')
  .bail()
  .trim()
  .isLength({ max: 150 })
  .withMessage('Department must not exceed 150 characters');

const statusValidation = body('status')
  .optional()
  .isIn(['active', 'inactive', 'suspended'])
  .withMessage('Status must be active, inactive, or suspended');

const teacherIdValidation = param('id')
  .isInt({ min: 1 })
  .withMessage('Teacher id must be a positive integer')
  .toInt();

export const createTeacherValidation = [
  nameValidation,
  emailValidation,
  passwordValidation,
  employeeNumberValidation,
  departmentValidation,
  statusValidation,
  handleValidationErrors,
];

export const updateTeacherValidation = [
  teacherIdValidation,
  body('name').optional().trim().isLength({ min: 2, max: 150 })
    .withMessage('Name must be between 2 and 150 characters'),
  body('email').optional().trim().isEmail()
    .withMessage('A valid email address is required').normalizeEmail(),
  body('password').optional().isString().withMessage('Password must be a string')
    .bail().isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .bail().custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must not exceed 72 bytes'),
  body('employeeNumber').optional().trim().notEmpty()
    .withMessage('Employee number cannot be empty').bail().isLength({ max: 50 })
    .withMessage('Employee number must not exceed 50 characters'),
  departmentValidation,
  statusValidation,
  body().custom((_value, { req }) => {
    const editableFields = ['name', 'email', 'password', 'employeeNumber', 'department', 'status'];

    if (!Object.keys(req.body).some((field) => editableFields.includes(field))) {
      throw new Error('At least one teacher field must be provided');
    }

    return true;
  }),
  handleValidationErrors,
];

export const teacherIdParamValidation = [teacherIdValidation, handleValidationErrors];

export const listTeachersValidation = [
  query('page').optional().default(1).isInt({ min: 1 })
    .withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().default(20).isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100').toInt(),
  query('search').optional().isString().withMessage('Search must be a string')
    .bail().trim().isLength({ max: 150 })
    .withMessage('Search must not exceed 150 characters'),
  handleValidationErrors,
];
