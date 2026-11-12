import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
  }),
});

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    description: z.string().max(500).optional(),
    isPrivate: z.boolean().default(false),
  }),
});

export const updateRoomSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    isPrivate: z.boolean().optional(),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({ roomId: z.string().uuid() }),
  body: z.object({
    content: z.string().min(1, 'Mensagem não pode ser vazia').max(5000),
    type: z.enum(['text', 'image', 'file']).default('text'),
    replyToId: z.string().uuid().optional().nullable(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});