const http = require('http');
const app = require('./app');
require('dotenv').config();
const configureSocket = require('./config/socket');
const { handleSocketConnection } = require('./sockets/socketHandler');

const server = http.createServer(app);
const io = configureSocket(server);
const { authenticateSocket } = require('./middleware/auth');

// Socket authentication
io.use(authenticateSocket);
handleSocketConnection(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});