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
  .isLength({ min: 2, max: 100 })
  .withMessage('Name must be between 2 and 100 characters');

const codeValidation = body('code')
  .trim()
  .notEmpty()
  .withMessage('Code is required')
  .bail()
  .isLength({ max: 20 })
  .withMessage('Code must not exceed 20 characters')
  .toUpperCase();

const descriptionValidation = body('description')
  .optional({ values: 'null' })
  .isString()
  .withMessage('Description must be a string')
  .bail()
  .trim()
  .isLength({ max: 10000 })
  .withMessage('Description must not exceed 10000 characters');

const statusValidation = body('status')
  .optional()
  .isIn(['active', 'inactive'])
  .withMessage('Status must be active or inactive');

const subjectIdValidation = param('id')
  .isInt({ min: 1 })
  .withMessage('Subject id must be a positive integer')
  .toInt();

export const createSubjectValidation = [
  nameValidation,
  codeValidation,
  descriptionValidation,
  statusValidation,
  handleValidationErrors,
];

export const updateSubjectValidation = [
  subjectIdValidation,
  body('name').optional().trim().isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('code').optional().trim().notEmpty().withMessage('Code cannot be empty')
    .bail().isLength({ max: 20 }).withMessage('Code must not exceed 20 characters')
    .toUpperCase(),
  descriptionValidation,
  statusValidation,
  body().custom((_value, { req }) => {
    const editableFields = ['name', 'code', 'description', 'status'];

    if (!Object.keys(req.body).some((field) => editableFields.includes(field))) {
      throw new Error('At least one subject field must be provided');
    }

    return true;
  }),
  handleValidationErrors,
];

export const subjectIdParamValidation = [subjectIdValidation, handleValidationErrors];

export const listSubjectsValidation = [
  query('page').optional().default(1).isInt({ min: 1 })
    .withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().default(20).isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100').toInt(),
  query('search').optional().isString().withMessage('Search must be a string')
    .bail().trim().isLength({ max: 100 })
    .withMessage('Search must not exceed 100 characters'),
  handleValidationErrors,
];
