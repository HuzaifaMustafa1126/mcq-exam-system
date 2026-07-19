import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { getAll, getByAttemptId } from '../controllers/result.controller.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import AppError from '../utils/AppError.js';

const router = Router();

const attemptIdValidation = [
  param('attemptId').isInt({ min: 1 }).withMessage('Attempt id must be a positive integer').toInt(),
  (req, _res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors.array()));
    }
    return next();
  },
];

const listValidation = [
  query('page').optional().default(1).isInt({ min: 1 }).toInt(),
  query('limit').optional().default(20).isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim().isLength({ max: 150 }),
  query('studentId').optional().isInt({ min: 1 }).toInt(),
  query('subjectId').optional().isInt({ min: 1 }).toInt(),
  query('examId').optional().isInt({ min: 1 }).toInt(),
  query('dateFrom').optional().isISO8601({ strict: true }),
  query('dateTo').optional().isISO8601({ strict: true }),
  query('status').optional().isIn(['pass', 'fail']),
  (req, _res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors.array()));
    return next();
  },
];

router.use(authenticate, authorize('student', 'teacher', 'admin'));

router.get('/', listValidation, getAll);
router.get('/:attemptId', attemptIdValidation, getByAttemptId);

export default router;
