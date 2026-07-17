import mysql from 'mysql2/promise';
import env from './env.js';

const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

export const testDatabaseConnection = async () => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.info('✅ Database Connected');
    return true;
  } catch (error) {
    console.error('❌ Database Connection Failed');

    if (!env.isProduction) {
      console.error(error.message);
    }

    return false;
  } finally {
    connection?.release();
  }
};

export const closeDatabasePool = async () => pool.end();

export default pool;
