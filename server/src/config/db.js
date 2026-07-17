import mysql from 'mysql2/promise';
import env from './env.js';

const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  waitForConnections: env.database.waitForConnections,
  connectionLimit: env.database.connectionLimit,
  queueLimit: env.database.queueLimit,
  enableKeepAlive: true,
});

export const testDatabaseConnection = async () => {
  const connection = await pool.getConnection();
  connection.release();
};

export const closeDatabasePool = () => pool.end();

export default pool;
