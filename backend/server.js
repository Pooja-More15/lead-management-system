require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const logger = require('./src/config/logger');
const prisma = require('./src/config/db');
const { initSocket } = require('./src/sockets/socket');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io WebSockets
initSocket(server);

// Connect database and boot server
async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully via Prisma Client.');

    server.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to establish database connection on startup:', error);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdowns & unhandled errors
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down server gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connections closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
