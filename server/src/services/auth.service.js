import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';
import { comparePassword } from '../utils/password.js';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

export const authenticateUser = async ({ email, password }) => {
  const [users] = await pool.execute(
    `SELECT id, name, email, password, role, status
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  const user = users[0];

  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, HTTP_STATUS.UNAUTHORIZED);
  }

  if (user.status !== 'active') {
    throw new AppError('Your account is not active', HTTP_STATUS.FORBIDDEN);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};
