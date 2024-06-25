import { uuid } from '@/config/zod-prim.ts';
import { z } from 'zod';

const email = z.string().email();
const username = z.string().min(3).max(128);
const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/);
const role = z.enum(['admin', 'user']);

export const UserGetResponse = z.object({
  id: uuid,
  email,
  username,
  role,
  created_at: z.number(),
  updated_at: z.number(),
});

export const UserPostRequest = z.object({
  email,
  username,
  password,
});

export const UserPatchRequest = z.object({
  id: uuid,
  email: email.optional(),
  username: username.optional(),
  password: password.optional(),
});

export const UserPatchResponse = z.object({
  id: uuid,
  email,
  username,
});
