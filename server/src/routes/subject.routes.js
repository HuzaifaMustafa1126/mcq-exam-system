import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  remove,
  update,
} from '../controllers/subject.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import {
  createSubjectValidation,
  listSubjectsValidation,
  subjectIdParamValidation,
  updateSubjectValidation,
} from '../validations/subject.validation.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.route('/')
  .post(createSubjectValidation, create)
  .get(listSubjectsValidation, getAll);

router.route('/:id')
  .get(subjectIdParamValidation, getById)
  .put(updateSubjectValidation, update)
  .delete(subjectIdParamValidation, remove);

export default router;
