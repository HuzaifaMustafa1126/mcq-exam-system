import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import {
  assignQuestions,
  getAssignedQuestions,
  removeAssignedQuestion,
} from '../services/examQuestion.service.js';
import { sendSuccess } from '../utils/response.js';

export const assign = asyncHandler(async (req, res) => {
  const data = await assignQuestions(req.params.examId, req.body.questionIds);
  return sendSuccess(res, { statusCode: HTTP_STATUS.CREATED, data });
});

export const getAll = asyncHandler(async (req, res) => {
  const data = await getAssignedQuestions(req.params.examId);
  return sendSuccess(res, { data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await removeAssignedQuestion(req.params.examId, req.params.questionId);
  return sendSuccess(res, { data });
});
