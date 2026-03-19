/**
 * Standalone Socket.IO server that bridges Redis pub/sub to WebSocket clients.
 *
 * Run as:  npx tsx src/lib/socket-server.ts
 */
import { createServer } from 'http';
import { Server } from 'socket.io';
import IORedis from 'ioredis';

const PORT = parseInt(process.env.SOCKET_PORT || '3001');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = 'pod:events';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Subscribe to Redis events
const subscriber = new IORedis(REDIS_URL);
subscriber.subscribe(CHANNEL);

subscriber.on('message', (_channel, message) => {
  try {
    const event = JSON.parse(message);
    const { type, userId, payload } = event;

    // Emit to the specific user's room
    io.to(`user:${userId}`).emit(type, payload);

    // Also emit batch-specific room events
    if (payload.batchJobId) {
      io.to(`batch:${payload.batchJobId}`).emit(type, payload);
    }
  } catch (err) {
    console.error('[Socket] Error parsing event:', err);
  }
});

// Handle client connections
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join user room
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`[Socket] ${socket.id} joined user:${userId}`);
  });

  // Join batch room for real-time progress
  socket.on('join:batch', (batchJobId: string) => {
    socket.join(`batch:${batchJobId}`);
    console.log(`[Socket] ${socket.id} joined batch:${batchJobId}`);
  });

  socket.on('leave:batch', (batchJobId: string) => {
    socket.leave(`batch:${batchJobId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
});
