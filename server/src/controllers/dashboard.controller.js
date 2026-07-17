import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import { getDashboardMetrics } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await getDashboardMetrics();

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data,
  });
});
