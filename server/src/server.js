import http from 'node:http';
import app from './app.js';
import { closeDatabasePool, testDatabaseConnection } from './config/db.js';
import env from './config/env.js';

const server = http.createServer(app);

const shutdown = async (signal) => {
  console.info(`${signal} received. Shutting down gracefully...`);
  server.close(async (error) => {
    if (error) {
      console.error('Server shutdown failed:', error);
      process.exit(1);
    }

    await closeDatabasePool();
    process.exit(0);
  });
};

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Set a different PORT value in .env.`);
    process.exit(1);
  }

  console.error('Server failed to start:', error);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  shutdown('unhandledRejection');
});

const startServer = async () => {
  await testDatabaseConnection();

  server.listen(env.port, () => {
    console.info(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });
};

startServer();
