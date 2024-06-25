import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import database from '@/config/database/drizzle.ts';
import { RequestParams } from '@/types.ts';
import { users } from '@/config/database/schema.ts';
import { jwtConfig } from '@/config/jwt.ts';
import { ConflictError, InternalServerError, UnauthorizedError } from '@/middlewares/error/base.ts';

import { LoginRequest, RegisterRequest } from './zod.ts';

// LOGIN
type LoginRequestBody = z.infer<typeof LoginRequest>;
type LoginResponseBody = { token: string };

export async function login(
  request: Request<RequestParams, LoginResponseBody, LoginRequestBody>,
  response: Response<LoginResponseBody>
) {
  const secret = process.env.JWT_SECRET;
  const loginRequest = LoginRequest.parse(request.body);

  if (!secret) throw new InternalServerError('JWT_SECRET is not defined.');

  const [user] = await database
    .select({ id: users.id, username: users.username, password: users.password, role: users.role })
    .from(users)
    .where(eq(users.email, loginRequest.email));

  if (!user) throw new UnauthorizedError('Invalid credentials.');

  const isVerified = await argon2.verify(user.password, request.body.password);

  if (!isVerified) throw new UnauthorizedError('Invalid credentials.');

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret,
    jwtConfig
  );

  if (token) return response.status(201).json({ token });

  throw new Error('Internal Server Error');
}

// POST REGISTER
type RegisterRequestBody = z.infer<typeof RegisterRequest>;
type RegisterResponseBody = { id: string; token: string };

export async function register(
  request: Request<RequestParams, RegisterResponseBody, RegisterRequestBody>,
  response: Response<RegisterResponseBody>
) {
  const secret = process.env.JWT_SECRET;

  if (!secret) throw new InternalServerError('Secret not defined');

  const user = RegisterRequest.parse(request.body);

  const hashedPassword = await argon2.hash(request.body.password);

  const data = await database
    .insert(users)
    .values({ email: user.email, username: user.username, password: hashedPassword })
    .returning({ id: users.id, username: users.username, role: users.role })
    .onConflictDoNothing()
    .catch((error) => {
      console.error(error);
      return null;
    });

  if (!data) throw new ConflictError('User already exist');

  const token = jwt.sign(data[0], secret, jwtConfig);

  if (token) return response.status(201).json({ id: data[0].id, token });

  throw new InternalServerError();
}
