import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getUsersMap, generateToken, hashPassword, comparePassword, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validate.js';

const users = getUsersMap();

export const authRouter = Router();

authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    for (const user of users.values()) {
      if (user.email === email) {
        throw new AppError(409, 'Email já cadastrado');
      }
    }

    const hashedPassword = await hashPassword(password);
    const id = uuidv4();
    const user = { id, email, password: hashedPassword, name, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` };
    users.set(id, user);

    const token = generateToken({ id: user.id, email: user.email, name: user.name, avatar: user.avatar });
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      token,
    });
  })
);

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    let foundUser: (typeof users)['values'] extends Map<string, infer V> ? V : never;
    for (const user of users.values()) {
      if (user.email === email) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser || !(await comparePassword(password, foundUser.password))) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    const token = generateToken({ id: foundUser.id, email: foundUser.email, name: foundUser.name, avatar: foundUser.avatar });
    res.json({
      user: { id: foundUser.id, email: foundUser.email, name: foundUser.name, avatar: foundUser.avatar },
      token,
    });
  })
);

authRouter.get(
  '/me',
  asyncHandler(async (req: AuthRequest, res) => {
    const user = users.get(req.user!.id);
    if (!user) throw new AppError(404, 'Usuário não encontrado');
    res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
  })
);