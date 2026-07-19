import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent,
} from '../services/student.service.js';
import { sendSuccess } from '../utils/response.js';
import { studentListQuery } from '../utils/query.js';

export const create = asyncHandler(async (req, res) => {
  const student = await createStudent(req.body);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    data: student,
  });
});

export const getAll = asyncHandler(async (req, res) => {
  const data = await getStudents(studentListQuery(req.query));

  return sendSuccess(res, { data });
});

export const getById = asyncHandler(async (req, res) => {
  const student = await getStudentById(req.params.id);

  return sendSuccess(res, { data: student });
});

export const update = asyncHandler(async (req, res) => {
  const student = await updateStudent(req.params.id, req.body);

  return sendSuccess(res, { data: student });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteStudent(req.params.id);

  return sendSuccess(res, {
    data: { message: 'Student deleted successfully' },
  });
});
