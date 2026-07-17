import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';

export const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(
        new AppError(
          'Authorization header is required',
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(
        new AppError(
          'Invalid authorization format. Use: Bearer <token>',
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return next(
        new AppError(
          'Invalid authentication token',
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }

    req.user = {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (error) {
    return next(
      new AppError(
        'Invalid or expired authentication token',
        HTTP_STATUS.UNAUTHORIZED
      )
    );
  }
};

export default authenticate;