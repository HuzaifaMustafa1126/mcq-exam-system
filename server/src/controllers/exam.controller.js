import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import {
  createExam,
  deleteExam,
  getExamById,
  getExams,
  updateExam,
} from '../services/exam.service.js';
import { sendSuccess } from '../utils/response.js';

export const create = asyncHandler(async (req, res) => {
  const exam = await createExam(req.body, req.user);
  return sendSuccess(res, { statusCode: HTTP_STATUS.CREATED, data: exam });
});

export const getAll = asyncHandler(async (req, res) => {
  const data = await getExams(req.query, req.user);
  return sendSuccess(res, { data });
});

export const getById = asyncHandler(async (req, res) => {
  const exam = await getExamById(req.params.id, req.user);
  return sendSuccess(res, { data: exam });
});

export const update = asyncHandler(async (req, res) => {
  const exam = await updateExam(req.params.id, req.body, req.user);
  return sendSuccess(res, { data: exam });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteExam(req.params.id, req.user);
  return sendSuccess(res, { data: { message: 'Exam deleted successfully' } });
});
