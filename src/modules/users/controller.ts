import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { RequestParams } from '@/types.ts';
import database from '@/config/database/drizzle.ts';
import { users } from '@/config/database/schema.ts';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NoDataFoundError,
} from '@/middlewares/error/base.ts';

import { UserGetResponse, UserPatchRequest, UserPatchResponse, UserPostRequest } from './zod.ts';

// GET
type GetResponse = z.infer<typeof UserGetResponse>;
type GetResponseBody = { user: GetResponse };

export async function get(request: Request, response: Response<GetResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id: queriedId } = request.params;

  if (typeof userId !== 'string' || typeof role !== 'string') throw new InternalServerError();
  if (role !== 'admin' && userId !== queriedId) throw new ForbiddenError();

  const [user]: GetResponse[] | undefined = await database
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(users)
    .where(eq(users.id, queriedId));

  if (!user) throw new NoDataFoundError();

  return response.status(200).json({ user });
}

// GET ALL
type GetAllResponseBody = { users: GetResponse[] };

export async function getAll(_: Request, response: Response<GetAllResponseBody>) {
  const { role } = response.locals;

  if (role !== 'admin') throw new ForbiddenError();

  const usersResponse: GetResponse[] = await database
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(users);

  if (usersResponse.length === 0) throw new NoDataFoundError();

  return response.status(200).json({ users: usersResponse });
}

// POST
type PostResponseBody = { id: string };
type PostRequestBody = z.infer<typeof UserPostRequest>;

export async function post(
  request: Request<RequestParams, PostResponseBody, PostRequestBody>,
  response: Response<PostResponseBody>
) {
  if (response.locals.user.role !== 'admin') throw new ForbiddenError();
  if (!request.body.password) throw new BadRequestError('No password provided');
  if (request.body.password.length < 0)
    throw new BadRequestError('Password should be longer than 8 characters');

  const hashed = await argon2.hash(request.body.password).catch((err) => {
    if (err instanceof Error) {
      throw new InternalServerError(err.message);
    }
  });

  if (!hashed) {
    throw new InternalServerError('Error occured while hashing');
  }

  const user = {
    email: request.body.email,
    username: request.body.username,
    password: hashed,
  };

  const [data] = await database.insert(users).values(user).returning({ id: users.id });

  return response.status(201).json({ id: data.id });
}

// PATCH
type PatchResponseBody = z.infer<typeof UserPatchResponse>;
type PatchRequestBody = z.infer<typeof UserPatchRequest>;

export async function patch(
  request: Request<RequestParams, PatchResponseBody, PatchRequestBody>,
  response: Response<PatchResponseBody>
) {
  const { id: userId, role } = response.locals;
  const { id: requestedId } = request.body;

  if (userId !== requestedId && role !== 'admin') throw new ForbiddenError();

  const patchUser = UserPatchRequest.parse(request.body);

  let hashed;
  if (patchUser.password) {
    hashed = await argon2.hash(patchUser.password).catch((err) => {
      if (err instanceof Error) {
        throw new InternalServerError(err.message);
      }
    });

    if (!hashed) {
      throw new InternalServerError('Error occured while hashing');
    }
  }

  const updateData = {
    username: patchUser.username,
    email: patchUser.email,
    password: hashed,
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

  if (userId !== id && role !== 'admin') {
    throw new ForbiddenError();
  }

  if (!id && id.length < 32) {
    throw new BadRequestError('Invalid id parameter');
  }

  const [body] = await database.delete(users).where(eq(users.id, id)).returning({ id: users.id });

  if (!body) {
    throw new NoDataFoundError();
  }

  return response.status(200).json(body);
}
