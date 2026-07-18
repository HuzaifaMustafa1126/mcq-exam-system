import asyncHandler from '../helpers/asyncHandler.js';
import { getResultByAttemptId, getResults } from '../services/result.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAll = asyncHandler(async (req, res) => {
  const results = await getResults(req.user);
  return sendSuccess(res, { data: { results } });
});

export const getByAttemptId = asyncHandler(async (req, res) => {
  const result = await getResultByAttemptId(req.user, req.params.attemptId);
  return sendSuccess(res, { data: result });
});
