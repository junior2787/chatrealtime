import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { createRoomSchema, updateRoomSchema, idParamSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validate.js';

interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  ownerId: string;
  memberIds: Set<string>;
  createdAt: Date;
  updatedAt: Date;
}

const rooms = new Map<string, Room>();

function getRoomsMap() {
  return rooms;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getUserRooms(userId: string): Room[] {
  return Array.from(rooms.values()).filter(r => r.memberIds.has(userId));
}

export const roomsRouter = Router();

roomsRouter.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const userRooms = getUserRooms(req.user!.id);
    res.json({
      rooms: userRooms.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isPrivate: r.isPrivate,
        ownerId: r.ownerId,
        memberCount: r.memberIds.size,
        createdAt: r.createdAt,
      })),
    });
  })
);

roomsRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const publicRooms = Array.from(rooms.values()).filter(r => !r.isPrivate);
    res.json({
      rooms: publicRooms.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        memberCount: r.memberIds.size,
      })),
    });
  })
);

roomsRouter.post(
  '/',
  validate(createRoomSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, description, isPrivate } = req.body;
    const id = uuidv4();
    const room: Room = {
      id,
      name,
      description,
      isPrivate: isPrivate || false,
      ownerId: req.user!.id,
      memberIds: new Set([req.user!.id]),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    rooms.set(id, room);
    res.status(201).json({ room: { ...room, memberCount: room.memberIds.size } });
  })
);

roomsRouter.get(
  '/:id',
  validate(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const room = rooms.get(req.params.id);
    if (!room) throw new AppError(404, 'Sala não encontrada');
    if (room.isPrivate && !room.memberIds.has(req.user!.id)) {
      throw new AppError(403, 'Sala privada');
    }
    res.json({
      room: {
        ...room,
        memberCount: room.memberIds.size,
        members: Array.from(room.memberIds),
      },
    });
  })
);

roomsRouter.put(
  '/:id',
  validate(updateRoomSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const room = rooms.get(req.params.id);
    if (!room) throw new AppError(404, 'Sala não encontrada');
    if (room.ownerId !== req.user!.id) throw new AppError(403, 'Apenas o dono pode editar');

    const { name, description, isPrivate } = req.body;
    if (name !== undefined) room.name = name;
    if (description !== undefined) room.description = description;
    if (isPrivate !== undefined) room.isPrivate = isPrivate;
    room.updatedAt = new Date();

    res.json({ room: { ...room, memberCount: room.memberIds.size } });
  })
);

roomsRouter.post(
  '/:id/join',
  validate(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const room = rooms.get(req.params.id);
    if (!room) throw new AppError(404, 'Sala não encontrada');
    if (room.isPrivate && room.ownerId !== req.user!.id) {
      throw new AppError(403, 'Sala privada - convite necessário');
    }
    room.memberIds.add(req.user!.id);
    res.json({ success: true, memberCount: room.memberIds.size });
  })
);

roomsRouter.post(
  '/:id/leave',
  validate(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const room = rooms.get(req.params.id);
    if (!room) throw new AppError(404, 'Sala não encontrada');
    if (room.ownerId === req.user!.id) throw new AppError(400, 'O dono não pode sair - transfira a posse ou delete a sala');
    room.memberIds.delete(req.user!.id);
    res.json({ success: true, memberCount: room.memberIds.size });
  })
);

roomsRouter.delete(
  '/:id',
  validate(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const room = rooms.get(req.params.id);
    if (!room) throw new AppError(404, 'Sala não encontrada');
    if (room.ownerId !== req.user!.id) throw new AppError(403, 'Apenas o dono pode deletar');
    rooms.delete(req.params.id);
    res.status(204).send();
  })
);

export { getRoomsMap };