import asyncHandler from '../helpers/asyncHandler.js';
import {
  getStudentExam,
  getStudentExamQuestions,
  getStudentExams,
  startStudentExam,
  submitStudentExam,
} from '../services/studentExam.service.js';
import { sendSuccess } from '../utils/response.js';
import { paginationQuery } from '../utils/query.js';

export const getAll = asyncHandler(async (req, res) => {
  const data = await getStudentExams(req.user.id);
  return sendSuccess(res, { data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await getStudentExam(req.user.id, req.params.id);
  return sendSuccess(res, { data });
});

export const start = asyncHandler(async (req, res) => {
  const data = await startStudentExam(req.user.id, req.params.examId);
  return sendSuccess(res, { data: { ...data, startTime: data.startedAt, endTime: data.expiresAt, duration: data.durationMinutes } });
});

export const getQuestions = asyncHandler(async (req, res) => {
  const data = await getStudentExamQuestions(req.user.id, req.params.examId, paginationQuery(req.query));
  return sendSuccess(res, { data });
});

export const submit = asyncHandler(async (req, res) => {
  const data = await submitStudentExam(req.user.id, req.params.examId, req.body.answers);
  return sendSuccess(res, { data });
});
