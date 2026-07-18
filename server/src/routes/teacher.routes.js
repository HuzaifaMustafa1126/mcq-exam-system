import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  remove,
  update,
} from '../controllers/teacher.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import {
  createTeacherValidation,
  listTeachersValidation,
  teacherIdParamValidation,
  updateTeacherValidation,
} from '../validations/teacher.validation.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.route('/')
  .post(createTeacherValidation, create)
  .get(listTeachersValidation, getAll);

router.route('/:id')
  .get(teacherIdParamValidation, getById)
  .put(updateTeacherValidation, update)
  .delete(teacherIdParamValidation, remove);

export default router;
