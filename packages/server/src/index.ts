import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server, Socket } from 'socket.io';
import { authRouter } from './routes/auth.js';
import { roomsRouter } from './routes/rooms.js';
import { messagesRouter } from './routes/messages.js';
import { usersRouter } from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from './middleware/auth.js';
import { setupSocketHandlers } from './socket/handlers.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3003;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições, tente novamente mais tarde' },
});
app.use('/api/', limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'chatrealtime' });
});

app.use('/api/auth', authRouter);
app.use('/api/rooms', authMiddleware, roomsRouter);
app.use('/api/messages', authMiddleware, messagesRouter);
app.use('/api/users', authMiddleware, usersRouter);

app.use(errorHandler);

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`💬 ChatRealTime server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
});