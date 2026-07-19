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

const optionsValidation = [
  body('options').isArray({ min: 4, max: 4 }).withMessage('Exactly four options are required')
    .bail().custom((options) => {
      if (options.filter((option) => option.isCorrect === true).length !== 1) {
        throw new Error('Exactly one option must be marked as correct');
      }
      return true;
    }),
  body('options.*.optionText').isString().withMessage('Option text must be a string')
    .bail().trim().notEmpty().withMessage('Option text is required')
    .bail().isLength({ max: 5000 }).withMessage('Option text must not exceed 5000 characters'),
  body('options.*.isCorrect').isBoolean({ strict: true })
    .withMessage('Option isCorrect must be a boolean').toBoolean(),
];

const questionIdValidation = param('id').isInt({ min: 1 })
  .withMessage('Question id must be a positive integer').toInt();

const subjectIdValidation = body('subjectId').isInt({ min: 1 })
  .withMessage('Subject id must be a positive integer').toInt();

const questionTextValidation = body('questionText').isString()
  .withMessage('Question text must be a string').bail().trim().notEmpty()
  .withMessage('Question text is required').bail().isLength({ max: 10000 })
  .withMessage('Question text must not exceed 10000 characters');

const marksValidation = body('marks').isFloat({ min: 0.01, max: 999999.99 })
  .withMessage('Marks must be between 0.01 and 999999.99').toFloat();

const difficultyValidation = body('difficulty').isIn(['easy', 'medium', 'hard'])
  .withMessage('Difficulty must be easy, medium, or hard');

const statusValidation = body('status').optional().isIn(['active', 'inactive'])
  .withMessage('Status must be active or inactive');

export const createQuestionValidation = [
  subjectIdValidation,
  questionTextValidation,
  marksValidation,
  difficultyValidation,
  statusValidation,
  ...optionsValidation,
  handleValidationErrors,
];

export const updateQuestionValidation = [
  questionIdValidation,
  body('subjectId').optional().isInt({ min: 1 })
    .withMessage('Subject id must be a positive integer').toInt(),
  body('questionText').optional().isString().withMessage('Question text must be a string')
    .bail().trim().notEmpty().withMessage('Question text cannot be empty')
    .bail().isLength({ max: 10000 }).withMessage('Question text must not exceed 10000 characters'),
  body('marks').optional().isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Marks must be between 0.01 and 999999.99').toFloat(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  statusValidation,
  body('options').optional().isArray({ min: 4, max: 4 }).withMessage('Exactly four options are required')
    .bail().custom((options) => {
      if (options.filter((option) => option.isCorrect === true).length !== 1) {
        throw new Error('Exactly one option must be marked as correct');
      }
      return true;
    }),
  body('options.*.optionText').if(body('options').exists()).isString().withMessage('Option text must be a string')
    .bail().trim().notEmpty().withMessage('Option text is required')
    .bail().isLength({ max: 5000 }).withMessage('Option text must not exceed 5000 characters'),
  body('options.*.isCorrect').if(body('options').exists()).isBoolean({ strict: true })
    .withMessage('Option isCorrect must be a boolean').toBoolean(),
  body().custom((_value, { req }) => {
    const editableFields = ['subjectId', 'questionText', 'marks', 'difficulty', 'status', 'options'];
    if (!Object.keys(req.body).some((field) => editableFields.includes(field))) {
      throw new Error('At least one question field must be provided');
    }
    return true;
  }),
  handleValidationErrors,
];

export const questionIdParamValidation = [questionIdValidation, handleValidationErrors];

export const listQuestionsValidation = [
  query('page').optional().default(1).isInt({ min: 1 })
    .withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().default(20).isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100').toInt(),
  query('search').optional().isString().withMessage('Search must be a string')
    .bail().trim().isLength({ max: 200 }).withMessage('Search must not exceed 200 characters'),
  query('subjectId').optional().isInt({ min: 1 })
    .withMessage('Subject id must be a positive integer').toInt(),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  query('status').optional().isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  handleValidationErrors,
];
