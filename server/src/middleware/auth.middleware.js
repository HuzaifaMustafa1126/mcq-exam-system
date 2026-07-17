import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';

export const authenticate = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication token is required', HTTP_STATUS.UNAUTHORIZED));
  }

  try {
    const payload = verifyToken(token);
    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || !payload.role) {
      throw new Error('Invalid token payload');
    }

    req.user = { id: userId, role: payload.role };
    return next();
  } catch (_error) {
    return next(new AppError('Invalid or expired authentication token', HTTP_STATUS.UNAUTHORIZED));
  }
};

export default authenticate;
