import dotenv from 'dotenv';

dotenv.config();

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT, 10) || 1126,
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
  },
});

if (env.isProduction && !env.jwt.secret) {
  throw new Error('JWT_SECRET must be configured in production');
}

if (env.isProduction && (!env.database.name || !env.database.user)) {
  throw new Error('DB_NAME and DB_USER must be configured in production');
}

export default env;
