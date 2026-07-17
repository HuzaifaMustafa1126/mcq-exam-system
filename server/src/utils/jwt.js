import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from './AppError.js';

const getJwtSecret = () => {
  if (!env.jwt.secret) {
    throw new AppError('JWT_SECRET is not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return env.jwt.secret;
};

export const generateToken = ({ id, role }) => jwt.sign(
  { role },
  getJwtSecret(),
  { subject: String(id), expiresIn: env.jwt.expiresIn },
);

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());
