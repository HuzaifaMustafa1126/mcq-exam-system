import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from './AppError.js';

const getJwtSecret = () => {
  if (!env.jwt?.secret) {
    throw new AppError(
      'JWT_SECRET is not configured',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  return env.jwt.secret;
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      subject: String(user.id),
      expiresIn: env.jwt.expiresIn,
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};