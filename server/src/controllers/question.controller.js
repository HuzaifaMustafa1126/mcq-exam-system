import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestions,
  updateQuestion,
} from '../services/question.service.js';
import { sendSuccess } from '../utils/response.js';
import { questionListQuery } from '../utils/query.js';

export const create = asyncHandler(async (req, res) => {
  const question = await createQuestion(req.body, req.user);
  return sendSuccess(res, { statusCode: HTTP_STATUS.CREATED, data: question });
});

export const getAll = asyncHandler(async (req, res) => {
  const data = await getQuestions(questionListQuery(req.query), req.user);
  return sendSuccess(res, { data });
});

export const getById = asyncHandler(async (req, res) => {
  const question = await getQuestionById(req.params.id, req.user);
  return sendSuccess(res, { data: question });
});

export const update = asyncHandler(async (req, res) => {
  const question = await updateQuestion(req.params.id, req.body, req.user);
  return sendSuccess(res, { data: question });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteQuestion(req.params.id, req.user);
  return sendSuccess(res, { data: { message: 'Question deleted successfully' } });
});
