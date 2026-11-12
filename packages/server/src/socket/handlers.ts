import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getUsersMap } from '../middleware/auth.js';
import { getRoom, getRoomsMap } from '../routes/rooms.js';
import { getMessages, addMessage, getMessagesMap } from '../routes/messages.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production-min-32-chars';

interface AuthenticatedSocket extends Socket {
  user?: { id: string; email: string; name: string; avatar?: string };
}

const userSockets = new Map<string, Set<string>>();

export function setupSocketHandlers(io: Server): void {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Token não fornecido'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; avatar?: string };
      const users = getUsersMap();
      const user = users.get(decoded.id);
      if (!user) return next(new Error('Usuário não encontrado'));

      socket.user = { id: user.id, email: user.email, name: user.name, avatar: user.avatar };
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user!.id;
    console.log(`🔌 User connected: ${socket.user!.name} (${userId})`);

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket.id);

    socket.join(`user:${userId}`);

    const rooms = getRoomsMap();
    for (const room of rooms.values()) {
      if (room.memberIds.has(userId)) {
        socket.join(`room:${room.id}`);
      }
    }

    broadcastUserStatus(io, userId, 'online');

    socket.on('join-room', (roomId: string) => {
      const room = getRoom(roomId);
      if (!room) return socket.emit('error', { message: 'Sala não encontrada' });
      if (room.isPrivate && !room.memberIds.has(userId)) {
        return socket.emit('error', { message: 'Sala privada' });
      }
      socket.join(`room:${roomId}`);
      room.memberIds.add(userId);
      io.to(`room:${roomId}`).emit('user-joined', { roomId, userId, userName: socket.user!.name });
      console.log(`👤 ${socket.user!.name} joined room ${room.name}`);
    });

    socket.on('leave-room', (roomId: string) => {
      const room = getRoom(roomId);
      if (!room) return;
      socket.leave(`room:${roomId}`);
      room.memberIds.delete(userId);
      io.to(`room:${roomId}`).emit('user-left', { roomId, userId, userName: socket.user!.name });
      console.log(`👋 ${socket.user!.name} left room ${room.name}`);
    });

    socket.on('send-message', (data: { roomId: string; content: string; type?: 'text' | 'image' | 'file'; replyToId?: string | null }) => {
      const { roomId, content, type = 'text', replyToId } = data;
      const room = getRoom(roomId);
      if (!room) return socket.emit('error', { message: 'Sala não encontrada' });
      if (!room.memberIds.has(userId)) return socket.emit('error', { message: 'Não é membro da sala' });

      const message = {
        id: crypto.randomUUID(),
        roomId,
        userId,
        userName: socket.user!.name,
        userAvatar: socket.user!.avatar,
        content,
        type,
        replyToId: replyToId || null,
        createdAt: new Date(),
        isEdited: false,
      };
      addMessage(message);
      io.to(`room:${roomId}`).emit('new-message', message);
    });

    socket.on('edit-message', (data: { roomId: string; messageId: string; content: string }) => {
      const { roomId, messageId, content } = data;
      const roomMessages = getMessages(roomId);
      const msgIndex = roomMessages.findIndex(m => m.id === messageId);
      if (msgIndex === -1) return socket.emit('error', { message: 'Mensagem não encontrada' });
      if (roomMessages[msgIndex].userId !== userId) return socket.emit('error', { message: 'Não pode editar' });

      roomMessages[msgIndex] = {
        ...roomMessages[msgIndex],
        content,
        updatedAt: new Date(),
        isEdited: true,
      };
      io.to(`room:${roomId}`).emit('message-edited', { roomId, message: roomMessages[msgIndex] });
    });

    socket.on('delete-message', (data: { roomId: string; messageId: string }) => {
      const { roomId, messageId } = data;
      const roomMessages = getMessages(roomId);
      const msgIndex = roomMessages.findIndex(m => m.id === messageId);
      if (msgIndex === -1) return socket.emit('error', { message: 'Mensagem não encontrada' });
      if (roomMessages[msgIndex].userId !== userId) return socket.emit('error', { message: 'Não pode deletar' });

      roomMessages.splice(msgIndex, 1);
      io.to(`room:${roomId}`).emit('message-deleted', { roomId, messageId });
    });

    socket.on('typing-start', (roomId: string) => {
      const room = getRoom(roomId);
      if (!room || !room.memberIds.has(userId)) return;
      socket.to(`room:${roomId}`).emit('user-typing', { roomId, userId, userName: socket.user!.name });
    });

    socket.on('typing-stop', (roomId: string) => {
      socket.to(`room:${roomId}`).emit('user-stopped-typing', { roomId, userId });
    });

    socket.on('read-messages', (roomId: string) => {
      socket.to(`room:${roomId}`).emit('messages-read', { roomId, userId, userName: socket.user!.name });
    });

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          broadcastUserStatus(io, userId, 'offline');
        }
      }
      console.log(`🔌 User disconnected: ${socket.user!.name} (${userId})`);
    });
  });
}

function broadcastUserStatus(io: Server, userId: string, status: 'online' | 'offline'): void {
  const users = getUsersMap();
  const user = users.get(userId);
  if (!user) return;

  const rooms = getRoomsMap();
  for (const room of rooms.values()) {
    if (room.memberIds.has(userId)) {
      io.to(`room:${room.id}`).emit('user-status', { userId, userName: user.name, status });
    }
  }
}

export function getOnlineUsers(): string[] {
  return Array.from(userSockets.keys());
}