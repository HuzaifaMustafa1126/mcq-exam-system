import { HTTP_STATUS } from '../constants/httpStatus.js';
import asyncHandler from '../helpers/asyncHandler.js';
import { getDashboardMetrics, getStudentDashboard as getStudentDashboardData } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await getDashboardMetrics();

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    data,
  });
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const data = await getStudentDashboardData(req.user.id);
  return sendSuccess(res, { statusCode: HTTP_STATUS.OK, data });
});
