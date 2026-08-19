const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.activeConnections = new Map(); // conv_id -> Set({ ws, userId })
    this.typingStatus = new Map(); // conv_id -> Map(userId -> boolean)
  }

  init(server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (request, socket, head) => {
      const parsedUrl = url.parse(request.url, true);
      const pathname = parsedUrl.pathname;

      const match = pathname.match(/^\/ws\/chat\/([^/]+)$/);
      if (!match) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      const convId = match[1];
      const token = parsedUrl.query.token;

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.user_id;

        const conv = await Conversation.findOne({ id: convId }).lean();
        if (!conv || (conv.buyer_id !== userId && conv.seller_id !== userId)) {
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
          return;
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, { userId, convId });
        });
      } catch (err) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws, request, { userId, convId }) => {
      this.addConnection(convId, ws, userId);

      ws.on('message', async (data) => {
        try {
          const payload = JSON.parse(data.toString());

          if (payload.type === 'typing') {
            const isTyping = Boolean(payload.is_typing);
            this.setTyping(convId, userId, isTyping);

            const user = await User.findOne({ id: userId }).lean();
            this.broadcastToConversation(
              convId,
              {
                type: 'typing',
                user_id: userId,
                user_name: user ? user.name : 'Unknown',
                is_typing: isTyping
              },
              userId
            );
          } else if (payload.type === 'read') {
            const messageId = payload.message_id;
            if (messageId) {
              await Message.updateOne(
                { id: messageId },
                {
                  $set: {
                    is_read: true,
                    read_at: new Date().toISOString()
                  }
                }
              );

              this.broadcastToConversation(
                convId,
                {
                  type: 'message_read',
                  message_id: messageId,
                  read_by: userId
                },
                userId
              );
            }
          }
        } catch (error) {
          console.error('WebSocket message handling error:', error);
        }
      });

      ws.on('close', () => {
        this.removeConnection(convId, ws);
        this.setTyping(convId, userId, false);
      });

      ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
      });
    });

    console.log('WebSocket Service Initialized on /ws/chat/:convId');
  }

  addConnection(convId, ws, userId) {
    if (!this.activeConnections.has(convId)) {
      this.activeConnections.set(convId, new Set());
    }
    this.activeConnections.get(convId).add({ ws, userId });
  }

  removeConnection(convId, ws) {
    if (this.activeConnections.has(convId)) {
      const connections = this.activeConnections.get(convId);
      for (const client of connections) {
        if (client.ws === ws) {
          connections.delete(client);
          break;
        }
      }
      if (connections.size === 0) {
        this.activeConnections.delete(convId);
      }
    }
  }

  setTyping(convId, userId, isTyping) {
    if (!this.typingStatus.has(convId)) {
      this.typingStatus.set(convId, new Map());
    }
    this.typingStatus.get(convId).set(userId, isTyping);
  }

  broadcastToConversation(convId, message, excludeUserId = null) {
    if (!this.activeConnections.has(convId)) return;

    const connections = this.activeConnections.get(convId);
    const jsonMessage = typeof message === 'string' ? message : JSON.stringify(message);

    for (const { ws, userId } of connections) {
      if (excludeUserId && userId === excludeUserId) continue;
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(jsonMessage);
        } catch (err) {
          console.error('Error sending WS message:', err);
        }
      }
    }
  }
}

const wsService = new WebSocketService();
module.exports = wsService;
