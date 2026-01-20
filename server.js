const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3888;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Inițializare Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.AUTH_URL
        : 'http://localhost:3888',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/api/socket/io',
  });

  // Middleware pentru autentificare Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verificare token și extragere userId
      // Token-ul va fi setat din client cu userId-ul
      socket.userId = token;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Event handlers pentru mesagerie
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user în room-ul propriu pentru notificări personale
    socket.join(`user:${socket.userId}`);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Typing indicator
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    // Mark message as read
    socket.on('mark_read', ({ conversationId, timestamp }) => {
      socket.to(`conversation:${conversationId}`).emit('messages_read', {
        userId: socket.userId,
        conversationId,
        timestamp
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  // Stocăm io instance pentru a fi accesibilă în API routes
  global.io = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io ready on path /api/socket/io`);
    });
});
