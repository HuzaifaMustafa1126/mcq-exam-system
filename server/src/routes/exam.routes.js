import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  remove,
  update,
} from '../controllers/exam.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import {
  createExamValidation,
  examIdParamValidation,
  listExamsValidation,
  updateExamValidation,
} from '../validations/exam.validation.js';

const router = Router();

router.use(authenticate, authorize('admin', 'teacher'));

router.route('/')
  .post(createExamValidation, create)
  .get(listExamsValidation, getAll);

router.route('/:id')
  .get(examIdParamValidation, getById)
  .put(updateExamValidation, update)
  .delete(examIdParamValidation, remove);

export default router;
