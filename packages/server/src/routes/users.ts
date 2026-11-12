import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { getUsersMap } from '../middleware/auth.js';
import { getUserRooms } from './rooms.js';

export const usersRouter = Router();

usersRouter.get(
  '/search',
  asyncHandler(async (req: AuthRequest, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ users: [] });
    }
    const users = getUsersMap();
    const results = Array.from(users.values())
      .filter(u => u.id !== req.user!.id && (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())))
      .slice(0, 10)
      .map(u => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar }));
    res.json({ users: results });
  })
);

usersRouter.get(
  '/online',
  asyncHandler(async (req: AuthRequest, res) => {
    const users = getUsersMap();
    const onlineUsers = Array.from(users.values())
      .filter(u => u.id !== req.user!.id)
      .map(u => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar }));
    res.json({ users: onlineUsers });
  })
);

usersRouter.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const users = getUsersMap();
    const user = users.get(req.params.id);
    if (!user) throw new AppError(404, 'Usuário não encontrado');
    const rooms = getUserRooms(user.id).filter(r => !r.isPrivate || r.memberIds.has(req.user!.id));
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        mutualRooms: rooms.map(r => ({ id: r.id, name: r.name })),
      },
    });
  })
);

usersRouter.put(
  '/me',
  asyncHandler(async (req: AuthRequest, res) => {
    const users = getUsersMap();
    const { name, avatar } = req.body;
    const user = users.get(req.user!.id);
    if (!user) throw new AppError(404, 'Usuário não encontrado');
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    users.set(user.id, user);
    res.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
  })
);