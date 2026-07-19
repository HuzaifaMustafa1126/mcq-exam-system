import asyncHandler from '../helpers/asyncHandler.js';
import { getResultDetails, getResults } from '../services/result.service.js';
import { sendSuccess } from '../utils/response.js';
import { resultListQuery } from '../utils/query.js';

export const getAll = asyncHandler(async (req, res) => {
  const data = await getResults(req.user, resultListQuery(req.query));
  return sendSuccess(res, { data });
});

export const getByAttemptId = asyncHandler(async (req, res) => {
  const result = await getResultDetails(req.user, req.params.attemptId);
  return sendSuccess(res, { data: result });
});
