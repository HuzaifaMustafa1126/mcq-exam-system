import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';
import { comparePassword } from '../utils/password.js';
import { hashPassword } from '../utils/password.js';

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

export const updateAuthenticatedUser = async (userId, { name, email, password }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id, name, email, role FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (!rows[0]) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    if (email !== undefined) {
      const [duplicates] = await connection.execute('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [email, userId]);
      if (duplicates[0]) throw new AppError('Email address is already in use', HTTP_STATUS.CONFLICT);
    }
    const fields = []; const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (password !== undefined) { fields.push('password = ?'); values.push(await hashPassword(password)); }
    if (fields.length) await connection.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...values, userId]);
    const [updated] = await connection.execute('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    await connection.commit(); return updated[0];
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
};
