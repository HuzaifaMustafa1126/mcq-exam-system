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

router.use(authenticate);

// Teachers need read access to subjects when authoring questions and exams, but
// subject administration remains an admin-only responsibility.
router.get('/', authorize('admin', 'teacher'), listSubjectsValidation, getAll);
router.post('/', authorize('admin'), createSubjectValidation, create);

router.get('/:id', authorize('admin', 'teacher'), subjectIdParamValidation, getById);
router.put('/:id', authorize('admin'), updateSubjectValidation, update);
router.delete('/:id', authorize('admin'), subjectIdParamValidation, remove);

export default router;
