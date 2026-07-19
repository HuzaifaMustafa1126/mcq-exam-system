import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import {
  getAll,
  getById,
  getQuestions,
  start,
  submit,
} from '../controllers/studentExam.controller.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import AppError from '../utils/AppError.js';

const router = Router();

router.use(authenticate, authorize('student'));

const submitValidation = [
  body('answers').isArray().withMessage('Answers must be an array'),
  body('answers.*.questionId').isInt({ min: 1 })
    .withMessage('Each question id must be a positive integer').toInt(),
  body('answers.*.optionId').optional().isInt({ min: 1 })
    .withMessage('Each option id must be a positive integer').toInt(),
  body('answers.*.selectedOptionId').optional().isInt({ min: 1 })
    .withMessage('Each selected option id must be a positive integer').toInt(),
  (req, _res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors.array()));
    }
    return next();
  },
];

const questionsPaginationValidation = [
  query('page').optional().default(1).isInt({ min: 1 })
    .withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().default(20).isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100').toInt(),
  (req, _res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors.array()));
    }
    return next();
  },
];

router.get('/', getAll);
router.get('/:id', getById);
router.post('/:examId/start', start);
router.get('/:examId/questions', questionsPaginationValidation, getQuestions);
router.post('/:examId/submit', submitValidation, submit);

export default router;
