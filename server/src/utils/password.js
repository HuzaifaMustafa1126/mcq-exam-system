import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash a plain password
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare plain password with hashed password
 */
export const comparePassword = async (
  plainPassword,
  hashedPassword
) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};