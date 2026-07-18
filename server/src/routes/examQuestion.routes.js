import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { assign, getAll, remove } from '../controllers/examQuestion.controller.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import AppError from '../utils/AppError.js';

const router = Router();

const handleValidationErrors = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors.array()));
  }
  return next();
};

const examIdValidation = param('examId').isInt({ min: 1 })
  .withMessage('Exam id must be a positive integer').toInt();
const questionIdValidation = param('questionId').isInt({ min: 1 })
  .withMessage('Question id must be a positive integer').toInt();

const assignValidation = [
  examIdValidation,
  body('questionIds').isArray({ min: 1, max: 1000 })
    .withMessage('questionIds must contain between 1 and 1000 questions')
    .bail().custom((questionIds) => {
      if (new Set(questionIds.map(Number)).size !== questionIds.length) {
        throw new Error('Duplicate question ids are not allowed');
      }
      return true;
    }),
  body('questionIds.*').isInt({ min: 1 })
    .withMessage('Each question id must be a positive integer').toInt(),
  handleValidationErrors,
];

const examValidation = [examIdValidation, handleValidationErrors];
const removeValidation = [examIdValidation, questionIdValidation, handleValidationErrors];

router.use(authenticate, authorize('admin', 'teacher'));

router.route('/:examId/questions')
  .post(assignValidation, assign)
  .get(examValidation, getAll);

router.delete('/:examId/questions/:questionId', removeValidation, remove);

export default router;
