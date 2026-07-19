import { HTTP_STATUS } from '../constants/httpStatus.js';
import pool from '../config/db.js';
import AppError from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';

export const authenticate = async (req, _res, next) => {
  let payload;
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

    payload = verifyToken(token);

    if (!payload) {
      return next(
        new AppError(
          'Invalid authentication token',
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }

  } catch (error) {
    return next(
      new AppError(
        'Invalid or expired authentication token',
        HTTP_STATUS.UNAUTHORIZED
      )
    );
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, status FROM users WHERE id = ? LIMIT 1',
      [Number(payload.sub)]
    );
    const user = rows[0];
    if (!user || user.status !== 'active' || user.role !== payload.role) {
      return next(new AppError('Your session is no longer valid. Please sign in again.', HTTP_STATUS.UNAUTHORIZED));
    }
    req.user = { id: Number(user.id), name: user.name, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
};

export default authenticate;
