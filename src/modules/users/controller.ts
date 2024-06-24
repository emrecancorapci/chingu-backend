import database from '@/config/database/drizzle.ts';
import { AuthLocal, ErrorResponse, Id, TableDate } from '@/types.ts';
import { NextFunction, Request, Response } from 'express';
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
type GetParameters = { id: string };
type GetResponseBody = { user: User };

export async function get(
  request: Request<GetParameters>,
  response: Response<GetResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { id: userId, role },
  } = response.locals;
  const { id: queriedId } = request.params;

  if (role !== 'admin' && userId !== queriedId) {
    throw new ForbiddenError();
  }

  try {
    const user: User | undefined = await database.query.users.findFirst({
      where: ({ id }) => eq(id, queriedId),
    });

    if (!user) {
      throw new NoDataFoundError();
    }
    return response.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

// GET ALL
type GetAllResponseBody = { users: User[] };

export async function getAll(
  _: Request,
  response: Response<GetAllResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { role },
  } = response.locals;

  if (role !== 'admin') {
    throw new ForbiddenError();
  }

  try {
    const users: User[] = await database.query.users.findMany();

    if (users.length === 0) {
      throw new NoDataFoundError();
    }
    return response.status(200).json({ users });
  } catch (error) {
    next(error);
  }
}

// POST
type PostResponseBody = { id: string };
type PostRequestBody = {
  email: string;
  password: string;
  username: string;
};

export async function post(
  request: Request<
    void, // Request Parameters
    PostResponseBody | ErrorResponse,
    PostRequestBody
  >,
  response: Response<PostResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  if (response.locals.user.role !== 'admin') {
    throw new ForbiddenError();
  }

  try {
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
  } catch (error) {
    next(error);
  }
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
  request: Request<
    void, // Request Parameters
    PatchResponseBody | ErrorResponse,
    PatchRequestBody
  >,
  response: Response<PatchResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { id: userId, role },
  } = response.locals;
  const { id: requestedId } = request.body;

  if (userId !== requestedId && role !== 'admin') {
    throw new ForbiddenError();
  }

  try {
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
  } catch (error) {
    next(error);
  }
}

// DELETE
type DeleteParameters = { id: string };
type DeleteResponseBody = { id: string };

export async function _delete(
  request: Request<DeleteParameters>,
  response: Response<DeleteResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { id: userId, role },
  } = response.locals;
  const { id } = request.params;

  if (userId !== id && role !== 'admin') {
    throw new ForbiddenError();
  }

  if (!id) {
    throw new BadRequestError('Missing id parameter');
  }

  try {
    const [body] = await database.delete(users).where(eq(users.id, id)).returning({ id: users.id });

    if (!body) {
      throw new NoDataFoundError();
    }

    return response.status(200).json(body);
  } catch (error) {
    next(error);
  }
}
