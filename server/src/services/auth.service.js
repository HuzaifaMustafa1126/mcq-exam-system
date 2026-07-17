import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';
import { comparePassword } from '../utils/password.js';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

export const authenticateUser = async ({ email, password }) => {
  // Validate input
  if (!email || !password) {
    throw new AppError(
      'Email and password are required',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Find user
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        name,
        email,
        password,
        role,
        status
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [normalizedEmail]
  );

  const user = rows[0];

  // Invalid email
  if (!user) {
    throw new AppError(
      INVALID_CREDENTIALS_MESSAGE,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Compare password
  const isPasswordCorrect = await comparePassword(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new AppError(
      INVALID_CREDENTIALS_MESSAGE,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Check account status
  if (user.status !== 'active') {
    throw new AppError(
      'Your account has been disabled. Please contact the administrator.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Return user without password
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};