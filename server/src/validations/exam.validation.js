import { body, param, query, validationResult } from 'express-validator';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const handleValidationErrors = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors.array()));
  }
  return next();
};

const statuses = ['draft', 'published', 'active', 'closed', 'archived'];

const validateDateRange = (endTime, { req }) => {
  if (endTime === undefined || endTime === null) return true;
  if (!req.body.startTime) throw new Error('Start time is required when end time is provided');
  if (new Date(endTime) <= new Date(req.body.startTime)) {
    throw new Error('End time must be later than start time');
  }
  return true;
};

const validatePassingMarks = (passingMarks, { req }) => {
  if (passingMarks === undefined || passingMarks === null || req.body.totalMarks === undefined) {
    return true;
  }
  if (Number(passingMarks) > Number(req.body.totalMarks)) {
    throw new Error('Passing marks cannot exceed total marks');
  }
  return true;
};

const subjectIdValidation = body('subjectId').isInt({ min: 1 })
  .withMessage('Subject id must be a positive integer').toInt();

const titleValidation = body('title').isString().withMessage('Title must be a string')
  .bail().trim().isLength({ min: 2, max: 255 })
  .withMessage('Title must be between 2 and 255 characters');

const descriptionValidation = body('description').optional({ values: 'null' })
  .isString().withMessage('Description must be a string')
  .bail().trim().isLength({ max: 10000 }).withMessage('Description must not exceed 10000 characters');

const durationValidation = body('durationMinutes').isInt({ min: 1, max: 32767 })
  .withMessage('Duration must be between 1 and 32767 minutes').toInt();

const totalMarksValidation = body('totalMarks').isFloat({ min: 0, max: 99999999.99 })
  .withMessage('Total marks must be between 0 and 99999999.99').toFloat();

const passingMarksValidation = body('passingMarks').isFloat({ min: 0, max: 99999999.99 })
  .withMessage('Passing marks must be between 0 and 99999999.99').bail()
  .custom(validatePassingMarks).toFloat();

const startTimeValidation = body('startTime').optional({ values: 'null' })
  .isISO8601().withMessage('Start time must be a valid ISO 8601 date-time').toDate();

const endTimeValidation = body('endTime').optional({ values: 'null' })
  .isISO8601().withMessage('End time must be a valid ISO 8601 date-time').bail()
  .custom(validateDateRange).toDate();

const statusValidation = body('status').optional().isIn(statuses)
  .withMessage('Status must be draft, published, active, closed, or archived');

const examIdValidation = param('id').isInt({ min: 1 })
  .withMessage('Exam id must be a positive integer').toInt();

export const createExamValidation = [
  subjectIdValidation,
  titleValidation,
  descriptionValidation,
  durationValidation,
  totalMarksValidation,
  passingMarksValidation,
  startTimeValidation,
  endTimeValidation,
  statusValidation,
  handleValidationErrors,
];

export const updateExamValidation = [
  examIdValidation,
  body('subjectId').optional().isInt({ min: 1 }).withMessage('Subject id must be a positive integer').toInt(),
  body('title').optional().isString().withMessage('Title must be a string')
    .bail().trim().isLength({ min: 2, max: 255 }).withMessage('Title must be between 2 and 255 characters'),
  descriptionValidation,
  body('durationMinutes').optional().isInt({ min: 1, max: 32767 })
    .withMessage('Duration must be between 1 and 32767 minutes').toInt(),
  body('totalMarks').optional().isFloat({ min: 0, max: 99999999.99 })
    .withMessage('Total marks must be between 0 and 99999999.99').toFloat(),
  body('passingMarks').optional().isFloat({ min: 0, max: 99999999.99 })
    .withMessage('Passing marks must be between 0 and 99999999.99').bail()
    .custom(validatePassingMarks).toFloat(),
  startTimeValidation,
  endTimeValidation,
  statusValidation,
  body().custom((_value, { req }) => {
    const editableFields = [
      'subjectId', 'title', 'description', 'durationMinutes', 'totalMarks',
      'passingMarks', 'startTime', 'endTime', 'status',
    ];
    if (!Object.keys(req.body).some((field) => editableFields.includes(field))) {
      throw new Error('At least one exam field must be provided');
    }
    return true;
  }),
  handleValidationErrors,
];

export const examIdParamValidation = [examIdValidation, handleValidationErrors];

export const listExamsValidation = [
  query('page').optional().default(1).isInt({ min: 1 })
    .withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().default(20).isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100').toInt(),
  query('search').optional().isString().withMessage('Search must be a string')
    .bail().trim().isLength({ max: 255 }).withMessage('Search must not exceed 255 characters'),
  query('subjectId').optional().isInt({ min: 1 })
    .withMessage('Subject id must be a positive integer').toInt(),
  handleValidationErrors,
];
