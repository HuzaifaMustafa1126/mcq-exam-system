import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  remove,
  update,
} from '../controllers/student.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import authorize from '../middleware/role.middleware.js';
import {
  createStudentValidation,
  listStudentsValidation,
  studentIdParamValidation,
  updateStudentValidation,
} from '../validations/student.validation.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.route('/')
  .post(createStudentValidation, create)
  .get(listStudentsValidation, getAll);

router.route('/:id')
  .get(studentIdParamValidation, getById)
  .put(updateStudentValidation, update)
  .delete(studentIdParamValidation, remove);

export default router;
