import database from '@/config/database/drizzle.ts';
import { ErrorResponse, TableDate } from '@/types.ts';
import { NextFunction, Request, Response } from 'express';
import { users } from '@/config/database/schema.ts';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@/config/jwt.ts';
import { UserBody } from '../users/types.ts';
import { ConflictError, InternalServerError, UnauthorizedError } from '@/middlewares/error/base.ts';

// LOGIN
type LoginRequestBody = { email: string; password: string };
type LoginResponseBody = { token: string };

export async function login(
  request: Request<
    void, // Request Parameters
    LoginResponseBody | ErrorResponse,
    LoginRequestBody
  >,
  response: Response<LoginResponseBody | ErrorResponse>,
  next: NextFunction
) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return response.status(500).json({ message: 'JWT_SECRET is not defined.' });
  }

  try {
    const user = await database.query.users.findFirst({
      where: (user) => eq(user.email, request.body.email),
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isVerified = await argon2.verify(user.password, request.body.password);

    if (!isVerified) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secret,
      jwtConfig
    );

    if (token) {
      return response.status(201).json({ token });
    }

    throw new Error('Internal Server Error');
  } catch (error) {
    next(error);
  }
}

// POST REGISTER
type RegisterRequestBody = {
  email: string;
  password: string;
  username: string;
};
type RegisterResponseBody = { id: string; token: string };

export async function register(
  request: Request<
    void, // Request Parameters
    RegisterResponseBody | ErrorResponse,
    RegisterRequestBody
  >,
  response: Response<RegisterResponseBody | ErrorResponse>,
  next: NextFunction
) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new InternalServerError('Secret not defined');
  }

  try {
    const passwordHash = await argon2.hash(request.body.password);

    const user: UserBody & TableDate = {
      email: request.body.email,
      username: request.body.username,
      password: passwordHash,
      role: 'user',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const data = await database
      .insert(users)
      .values(user)
      .returning({ id: users.id })
      .onConflictDoNothing()
      .catch((error) => {
        console.error(error);
        return null;
      });

    if (!data) {
      throw new ConflictError('User already exist');
    }

    const id = data[0].id;

    const token = jwt.sign({ id, username: user.username, role: user.role }, secret, jwtConfig);

    if (token) {
      return response.status(201).json({ id, token });
    }

    throw new InternalServerError();
  } catch (error) {
    next(error);
  }
}
