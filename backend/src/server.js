const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const app = require('./app');
const wsService = require('./services/websocketService');

const PORT = process.env.PORT || 8000;

async function startServer() {
  await connectDB();

  const OTP = require('./models/OTP');
  try {
    await OTP.collection.dropIndex('phone_1');
  } catch (e) {}
  await OTP.syncIndexes().catch(() => {});

  const server = http.createServer(app);

  // Initialize WebSockets
  wsService.init(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GGS Express Server running on port ${PORT}`);
    console.log(`📡 REST API endpoint: http://localhost:${PORT}/api`);
    console.log(`💬 WebSocket endpoint: ws://localhost:${PORT}/ws/chat/:convId`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
