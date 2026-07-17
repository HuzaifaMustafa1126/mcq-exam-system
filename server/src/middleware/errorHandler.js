import env from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const errorHandler = (error, _req, res, _next) => {
  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const response = {
    success: false,
    message: error.isOperational ? error.message : 'Internal server error',
  };

  if (error.details) response.details = error.details;
  if (!env.isProduction && !error.isOperational) response.stack = error.stack;
  if (!error.isOperational) console.error(error);

  res.status(statusCode).json(response);
};

export default errorHandler;
