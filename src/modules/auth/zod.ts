import { z } from 'zod';

const email = z.string().email();
const username = z.string().min(3).max(128);
const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/);

export const RegisterRequest = z.object({
  email,
  username,
  password,
});

export const LoginRequest = z.object({
  email,
  password,
});
