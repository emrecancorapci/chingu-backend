import database from '@/config/database/drizzle.ts';
import { Id, RequestParams, TableDate } from '@/types.ts';
import { Request, Response } from 'express';
import { UserBody } from './types.ts';
import { users } from '@/config/database/schema.ts';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NoDataFoundError,
} from '@/middlewares/error/base.ts';

// GET
type User = UserBody & Id & TableDate;
type GetResponseBody = { user: User };

export async function get(request: Request, response: Response<GetResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id: queriedId } = request.params;

  if (typeof userId !== 'string' || typeof role !== 'string') {
    throw new InternalServerError();
  }

  if (role !== 'admin' && userId !== queriedId) {
    throw new ForbiddenError();
  }

  const user: User | undefined = await database.query.users.findFirst({
    where: ({ id }) => eq(id, queriedId),
  });

  if (!user) {
    throw new NoDataFoundError();
  }
  return response.status(200).json({ user });
}

// GET ALL
type GetAllResponseBody = { users: User[] };

export async function getAll(_: Request, response: Response<GetAllResponseBody>) {
  const { role } = response.locals;

  if (role !== 'admin') {
    throw new ForbiddenError();
  }

  const users: User[] = await database.query.users.findMany();

  if (users.length === 0) {
    throw new NoDataFoundError();
  }
  return response.status(200).json({ users });
}

// POST
type PostResponseBody = { id: string };
type PostRequestBody = {
  email: string;
  password: string;
  username: string;
};

export async function post(
  request: Request<RequestParams, PostResponseBody, PostRequestBody>,
  response: Response<PostResponseBody>
) {
  if (response.locals.user.role !== 'admin') {
    throw new ForbiddenError();
  }
  if (!request.body.password) {
    throw new BadRequestError('No password provided');
  }

  if (request.body.password.length < 0) {
    throw new BadRequestError('Password should be longer than 8 characters');
  }

  const hashed = await argon2.hash(request.body.password).catch((err) => {
    if (err instanceof Error) {
      throw new InternalServerError(err.message);
    }
  });

  if (!hashed) {
    throw new InternalServerError('Error occured while hashing');
  }

  const user: UserBody & TableDate = {
    email: request.body.email,
    username: request.body.username,
    password: hashed,
    role: 'user',
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const [data] = await database.insert(users).values(user).returning({ id: users.id });

  return response.status(201).json({ id: data.id });
}

// PATCH
type PatchBody = {
  email?: string;
  username?: string;
  password?: string;
} & Id;

type PatchResponseBody = PatchBody;
type PatchRequestBody = PatchBody;

export async function patch(
  request: Request<RequestParams, PatchResponseBody, PatchRequestBody>,
  response: Response<PatchResponseBody>
) {
  const { id: userId, role } = response.locals;
  const { id: requestedId } = request.body;

  if (typeof userId !== 'string' || typeof role !== 'string') {
    throw new InternalServerError();
  }

  if (userId !== requestedId && role !== 'admin') {
    throw new ForbiddenError();
  }
  if (!request.body.password) {
    throw new BadRequestError('No password provided');
  }

  if (request.body.password.length < 0) {
    throw new BadRequestError('Password should be longer than 8 characters');
  }

  const hashed = await argon2.hash(request.body.password).catch((err) => {
    if (err instanceof Error) {
      throw new InternalServerError(err.message);
    }
  });

  if (!hashed) {
    throw new InternalServerError('Error occured while hashing');
  }

  const updateData = {
    ...request.body,
    password: hashed,
    updated_at: Date.now(),
  };

  const [{ id, email, username }] = await database
    .update(users)
    .set(updateData)
    .where(eq(users.id, requestedId))
    .returning();

  return response.status(200).json({ id, email, username });
}

// DELETE
type DeleteResponseBody = { id: string };

export async function _delete(request: Request, response: Response<DeleteResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id } = request.params;

  if (typeof userId !== 'string' || typeof role !== 'string') {
    throw new InternalServerError();
  }

  if (userId !== id && role !== 'admin') {
    throw new ForbiddenError();
  }

  if (!id) {
    throw new BadRequestError('Missing id parameter');
  }

  const [body] = await database.delete(users).where(eq(users.id, id)).returning({ id: users.id });

  if (!body) {
    throw new NoDataFoundError();
  }

  return response.status(200).json(body);
}
