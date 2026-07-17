import http from 'node:http';
import app from './app.js';
import { closeDatabasePool, testDatabaseConnection } from './config/db.js';
import env from './config/env.js';

const server = http.createServer(app);

const startServer = async () => {
  try {
    await testDatabaseConnection();
    console.info('MySQL database connected');
  } catch (error) {
    console.warn(`MySQL connection unavailable: ${error.message}`);
  }

  server.listen(env.port, () => {
    console.info(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });
};

const shutdown = async (signal) => {
  console.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await closeDatabasePool();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  shutdown('unhandledRejection');
});

startServer();
