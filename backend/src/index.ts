import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { setupSocketHandlers } from './socket';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  reconnectOnError: (err) => {
    console.log('Redis reconnect on error:', err);
    return true;
  }
});

// Handle Redis errors explicitly
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis successfully');
});

// Define CORS configuration
const corsOptions = {
  origin: true, // Allow all origins (automatically reflect the request origin)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'Access-Control-Allow-Origin']
};

// Apply CORS middleware to Express
app.use(cors(corsOptions));

// Initialize Socket.IO with improved configuration
const io = new Server(server, {
  cors: {
    origin: true, // Reflect the request origin
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['polling', 'websocket'], // Try polling first, then websocket
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000,
  allowEIO3: true,
  maxHttpBufferSize: 1e8 // 100MB
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Import API routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import messageRoutes from './routes/messages';

// Use API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Setup socket handlers
setupSocketHandlers(io, prisma, redis);

// Error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // Listen on all interfaces
server.listen(Number(PORT), HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`For local network access: http://192.168.1.15:${PORT}`);
});

// Handle shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  await redis.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown); 