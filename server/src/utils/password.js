import bcrypt from 'bcrypt';

export const comparePassword = async (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);
