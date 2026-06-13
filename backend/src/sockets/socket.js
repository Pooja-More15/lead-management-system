const socketIo = require('socket.io');
const logger = require('../config/logger');

let io = null;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    // Join a room corresponding to the user's ID for direct targeting
    socket.on('join', (userId) => {
      socket.join(userId);
      logger.info(`Socket client ${socket.id} joined room: ${userId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  return io;
};

// Emit status/lead updates to all active sessions (e.g., dashboard counters refresh)
const emitGlobalUpdate = (event, data) => {
  if (io) {
    io.emit(event, data);
    logger.debug(`WebSocket emitted global event: ${event}`);
  }
};

// Emit message directly to a specific user (e.g., assigned Agent toast)
const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(userId).emit(event, data);
    logger.info(`WebSocket emitted targeted event to user ${userId}: ${event}`);
  }
};

module.exports = {
  initSocket,
  getIo,
  emitGlobalUpdate,
  emitToUser,
};
