import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { sendMessageSchema, idParamSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validate.js';
import { getRoom } from './rooms.js';

interface Message {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file';
  replyToId?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
}

const messages = new Map<string, Message[]>();

function getMessages(roomId: string): Message[] {
  return messages.get(roomId) || [];
}

function addMessage(message: Message): void {
  const roomMessages = messages.get(message.roomId) || [];
  roomMessages.push(message);
  messages.set(message.roomId, roomMessages);
}

export function getMessagesMap() {
  return messages;
}

export const messagesRouter = Router();

messagesRouter.get(
  '/:roomId',
  asyncHandler(async (req: AuthRequest, res) => {
    const { roomId } = req.params;
    const room = getRoom(roomId);
    if (!room) throw new AppError(404, 'Sala não encontrada');
    if (room.isPrivate && !room.memberIds.has(req.user!.id)) {
      throw new AppError(403, 'Sala privada');
    }

    const roomMessages = getMessages(roomId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const start = (page - 1) * limit;
    const paginated = roomMessages.slice(-start - limit, -start || undefined).reverse();

    res.json({
      messages: paginated,
      pagination: { page, limit, total: roomMessages.length },
    });
  })
);

messagesRouter.post(
  '/:roomId',
  validate(sendMessageSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { roomId } = req.params;
    const { content, type, replyToId } = req.body;
    const room = getRoom(roomId);
    if (!room) throw new AppError(404, 'Sala não encontrada');
    if (!room.memberIds.has(req.user!.id)) throw new AppError(403, 'Você não é membro desta sala');

    const message: Message = {
      id: uuidv4(),
      roomId,
      userId: req.user!.id,
      userName: req.user!.name,
      userAvatar: req.user!.avatar,
      content,
      type,
      replyToId: replyToId || null,
      createdAt: new Date(),
      isEdited: false,
    };
    addMessage(message);
    res.status(201).json({ message });
  })
);

messagesRouter.put(
  '/:roomId/:messageId',
  validate(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { roomId, messageId } = req.params;
    const { content } = req.body;
    const roomMessages = getMessages(roomId);
    const msgIndex = roomMessages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) throw new AppError(404, 'Mensagem não encontrada');
    if (roomMessages[msgIndex].userId !== req.user!.id) throw new AppError(403, 'Não pode editar mensagem de outro usuário');

    roomMessages[msgIndex] = {
      ...roomMessages[msgIndex],
      content,
      updatedAt: new Date(),
      isEdited: true,
    };
    res.json({ message: roomMessages[msgIndex] });
  })
);

messagesRouter.delete(
  '/:roomId/:messageId',
  validate(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { roomId, messageId } = req.params;
    const roomMessages = getMessages(roomId);
    const msgIndex = roomMessages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) throw new AppError(404, 'Mensagem não encontrada');
    if (roomMessages[msgIndex].userId !== req.user!.id) throw new AppError(403, 'Não pode deletar mensagem de outro usuário');

    roomMessages.splice(msgIndex, 1);
    res.status(204).send();
  })
);