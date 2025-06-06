const socketIo = require('socket.io');

const configureSocket = (server) => {
  return socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
};

module.exports = configureSocket;