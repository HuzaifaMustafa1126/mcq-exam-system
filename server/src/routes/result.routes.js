import { Router } from 'express';
import { param, validationResult } from 'express-validator';
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

router.use(authenticate, authorize('student', 'teacher', 'admin'));

router.get('/', getAll);
router.get('/:attemptId', attemptIdValidation, getByAttemptId);

export default router;
