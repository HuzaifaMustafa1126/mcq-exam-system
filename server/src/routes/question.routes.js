import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  remove,
  update,
} from '../controllers/question.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import {
  createQuestionValidation,
  listQuestionsValidation,
  questionIdParamValidation,
  updateQuestionValidation,
} from '../validations/question.validation.js';

const router = Router();

router.use(authenticate, authorize('admin', 'teacher'));

router.route('/')
  .post(createQuestionValidation, create)
  .get(listQuestionsValidation, getAll);

router.route('/:id')
  .get(questionIdParamValidation, getById)
  .put(updateQuestionValidation, update)
  .delete(questionIdParamValidation, remove);

export default router;
