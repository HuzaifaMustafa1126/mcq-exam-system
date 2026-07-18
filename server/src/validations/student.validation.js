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

const rollNumberValidation = body('rollNumber')
  .trim()
  .notEmpty()
  .withMessage('Roll number is required')
  .bail()
  .isLength({ max: 50 })
  .withMessage('Roll number must not exceed 50 characters');

const registrationNumberValidation = body('registrationNumber')
  .trim()
  .notEmpty()
  .withMessage('Registration number is required')
  .bail()
  .isLength({ max: 50 })
  .withMessage('Registration number must not exceed 50 characters');

const semesterValidation = body('semester')
  .isInt({ min: 1, max: 20 })
  .withMessage('Semester must be an integer between 1 and 20')
  .toInt();

const sectionValidation = body('section')
  .trim()
  .notEmpty()
  .withMessage('Section is required')
  .bail()
  .isLength({ max: 30 })
  .withMessage('Section must not exceed 30 characters');

const sessionValidation = body('session')
  .trim()
  .notEmpty()
  .withMessage('Session is required')
  .bail()
  .isLength({ max: 30 })
  .withMessage('Session must not exceed 30 characters');

const phoneValidation = body('phone')
  .trim()
  .matches(/^[0-9+() -]{7,30}$/)
  .withMessage('Phone must be between 7 and 30 valid phone characters');

const statusValidation = body('status')
  .optional()
  .isIn(['active', 'inactive', 'suspended'])
  .withMessage('Status must be active, inactive, or suspended');

const studentIdValidation = param('id')
  .isInt({ min: 1 })
  .withMessage('Student id must be a positive integer')
  .toInt();

export const createStudentValidation = [
  nameValidation,
  emailValidation,
  passwordValidation,
  rollNumberValidation,
  registrationNumberValidation,
  semesterValidation,
  sectionValidation,
  sessionValidation,
  phoneValidation,
  statusValidation,
  handleValidationErrors,
];

export const updateStudentValidation = [
  studentIdValidation,
  body('name').optional().trim().isLength({ min: 2, max: 150 })
    .withMessage('Name must be between 2 and 150 characters'),
  body('email').optional().trim().isEmail()
    .withMessage('A valid email address is required').normalizeEmail(),
  body('password').optional().isString().withMessage('Password must be a string')
    .bail().isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .bail().custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must not exceed 72 bytes'),
  body('rollNumber').optional().trim().notEmpty()
    .withMessage('Roll number cannot be empty').bail().isLength({ max: 50 })
    .withMessage('Roll number must not exceed 50 characters'),
  body('registrationNumber').optional().trim().notEmpty()
    .withMessage('Registration number cannot be empty').bail().isLength({ max: 50 })
    .withMessage('Registration number must not exceed 50 characters'),
  body('semester').optional().isInt({ min: 1, max: 20 })
    .withMessage('Semester must be an integer between 1 and 20').toInt(),
  body('section').optional().trim().notEmpty().withMessage('Section cannot be empty')
    .bail().isLength({ max: 30 }).withMessage('Section must not exceed 30 characters'),
  body('session').optional().trim().notEmpty().withMessage('Session cannot be empty')
    .bail().isLength({ max: 30 }).withMessage('Session must not exceed 30 characters'),
  body('phone').optional().trim().matches(/^[0-9+() -]{7,30}$/)
    .withMessage('Phone must be between 7 and 30 valid phone characters'),
  statusValidation,
  body().custom((_value, { req }) => {
    const editableFields = [
      'name', 'email', 'password', 'rollNumber', 'registrationNumber',
      'semester', 'section', 'session', 'phone', 'status',
    ];

    if (!Object.keys(req.body).some((field) => editableFields.includes(field))) {
      throw new Error('At least one student field must be provided');
    }

    return true;
  }),
  handleValidationErrors,
];

export const studentIdParamValidation = [studentIdValidation, handleValidationErrors];

export const listStudentsValidation = [
  query('page').optional().default(1).isInt({ min: 1 })
    .withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().default(20).isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100').toInt(),
  query('search').optional().isString().withMessage('Search must be a string')
    .bail().trim().isLength({ max: 150 })
    .withMessage('Search must not exceed 150 characters'),
  handleValidationErrors,
];
