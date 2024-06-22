import database from '@/config/database/drizzle.ts';
import { ErrorResponse, TableDate } from '@/types.ts';
import { Request, Response } from 'express';
import { users } from '@/config/database/schema.ts';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@/config/jwt.ts';
import { UserBody } from '../users/types.ts';

// LOGIN
type LoginRequestBody = { email: string; password: string };
type LoginResponseBody = { token: string };

export async function login(
  request: Request<
    void, // Request Parameters
    LoginResponseBody | ErrorResponse,
    LoginRequestBody
  >,
  response: Response<LoginResponseBody | ErrorResponse>
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
      return response.status(404).json({ message: 'Invalid email or password.' });
    }

    const isVerified = await argon2.verify(user.password, request.body.password);

    if (!isVerified) {
      return response.status(404).json({ message: 'Invalid email or password.' });
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
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
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
  response: Response<RegisterResponseBody | ErrorResponse>
) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return response.status(500).json({ message: 'JWT_SECRET is not defined.' });
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
      return response.status(409).json({ message: 'User already exists.' });
    }

    const token = jwt.sign(
      { id: data[0].id, username: user.username, role: user.role },
      secret,
      jwtConfig
    );

    if (token) {
      return response.status(201).json({ id: data[0].id, token });
    }

    throw new Error('Internal Server Error');
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}
