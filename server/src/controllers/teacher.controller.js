import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import {
  createTeacher,
  deleteTeacher,
  getTeacherById,
  getTeachers,
  updateTeacher,
} from '../services/teacher.service.js';
import { sendSuccess } from '../utils/response.js';
import { teacherListQuery } from '../utils/query.js';

export const create = asyncHandler(async (req, res) => {
  const teacher = await createTeacher(req.body);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    data: teacher,
  });
});

export const getAll = asyncHandler(async (req, res) => {
  const data = await getTeachers(teacherListQuery(req.query));

  return sendSuccess(res, { data });
});

export const getById = asyncHandler(async (req, res) => {
  const teacher = await getTeacherById(req.params.id);

  return sendSuccess(res, { data: teacher });
});

export const update = asyncHandler(async (req, res) => {
  const teacher = await updateTeacher(req.params.id, req.body);

  return sendSuccess(res, { data: teacher });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteTeacher(req.params.id);

  return sendSuccess(res, {
    data: { message: 'Teacher deleted successfully' },
  });
});
