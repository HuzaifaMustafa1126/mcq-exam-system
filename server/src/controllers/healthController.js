import { HTTP_STATUS } from '../constants/httpStatus.js';

export const getHealth = (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'MCQ Exam API is running',
  });
};
