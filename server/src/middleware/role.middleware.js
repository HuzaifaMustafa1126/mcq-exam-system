import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication is required', HTTP_STATUS.UNAUTHORIZED));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to access this resource', HTTP_STATUS.FORBIDDEN));
  }

  return next();
};

export default authorize;
