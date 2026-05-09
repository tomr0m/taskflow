import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocket } from './lib/socket.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Build CORS allowed origins list
const FRONTEND_URL = process.env.FRONTEND_URL;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// Add production frontend URL if defined
if (FRONTEND_URL && FRONTEND_URL !== '*') {
  allowedOrigins.push(FRONTEND_URL);
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // If FRONTEND_URL is "*", allow all
      if (FRONTEND_URL === '*') return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many auth attempts, please try again later',
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/boards', boardRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

// Attach Socket.io to the same HTTP server as Express
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`✅ TaskFlow API running on http://localhost:${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});