import pool, { closeDatabasePool } from '../config/db.js';
import { hashPassword } from '../utils/password.js';

const ADMIN = Object.freeze({
  name: 'Super Admin',
  email: 'admin@example.com',
  password: 'Admin@123',
  role: 'admin',
  status: 'active',
});

const seedAdmin = async () => {
  try {
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [ADMIN.email],
    );

    if (existingUsers.length > 0) {
      console.info('ℹ️ Admin already exists');
      return;
    }

    const passwordHash = await hashPassword(ADMIN.password);

    await pool.execute(
      `INSERT INTO users (name, email, password, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      [ADMIN.name, ADMIN.email, passwordHash, ADMIN.role, ADMIN.status],
    );

    console.info('✅ Super Admin created successfully.');
  } catch (error) {
    console.error('❌ Failed to seed Super Admin:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await closeDatabasePool();
    } catch (error) {
      console.error('❌ Failed to close database connection:', error.message);
      process.exitCode = 1;
    }
  }
};

seedAdmin();
