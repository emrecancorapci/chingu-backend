import database from '@/config/database/drizzle.ts';
import { AuthToken, ErrorResponse, Id, TableDate } from '@/types.ts';
import { Request, Response } from 'express';
import { UserBody } from './types.ts';
import { users } from '@/config/database/schema.ts';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';

type Locals = { user: AuthToken };

// GET
type User = UserBody & Id & TableDate;
type GetParameters = { id: string };
type GetResponseBody = { user: User };

export async function get(
  request: Request<
    GetParameters,
    GetResponseBody | ErrorResponse,
    void, // Request Body
    void, // Request Query
    Locals
  >,
  response: Response<GetResponseBody | ErrorResponse>
) {
  const { userId, role } = response.locals;
  const { id: queriedId } = request.params;

  if (role !== 'admin' && userId !== queriedId) {
    return response.status(403).json({ message: 'Forbidden' });
  }

  try {
    const user: User | undefined = await database.query.users.findFirst({
      where: ({ id }) => eq(id, queriedId),
    });

    if (!user) {
      return response.status(404).json({ message: 'No data found.' });
    }
    return response.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}

// GET ALL
type GetAllResponseBody = { users: User[] };

export async function getAll(
  _: Request<
    void,
    GetAllResponseBody | ErrorResponse,
    void, // Request Body
    void, // Request Query
    Locals
  >,
  response: Response<GetAllResponseBody | ErrorResponse>
) {
  const { role } = response.locals;

  if (role !== 'admin') {
    return response.status(403).json({ message: 'Forbidden' });
  }

  try {
    const users: User[] = await database.query.users.findMany();

    if (users.length === 0) {
      return response.status(404).json({ message: 'No data found.' });
    }
    return response.status(200).json({ users });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
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
    PostRequestBody,
    void, // Request Query
    Locals
  >,
  response: Response<PostResponseBody | ErrorResponse>
) {
  if (response.locals.role !== 'admin') {
    return response.status(403).json({ message: 'Forbidden' });
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

    const [data] = await database.insert(users).values(user).returning({ id: users.id });

    return response.status(201).json({ id: data.id });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
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
    PatchRequestBody,
    void, // Request Query
    Locals
  >,
  response: Response<PatchResponseBody | ErrorResponse>
) {
  const { userId, role } = response.locals;
  const { id: requestedId } = request.body;

  if (userId !== requestedId && role !== 'admin') {
    return response.status(403).json({ message: 'Forbidden' });
  }

  try {
    const updateData = {
      ...request.body,
      updated_at: Date.now(),
    };

    if (request.body.password) {
      updateData.password = await argon2.hash(request.body.password);
    }

    const [{ id, email, username }] = await database
      .update(users)
      .set(updateData)
      .where(eq(users.id, requestedId))
      .returning();

    return response.status(200).json({ id, email, username });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}

// DELETE
type DeleteParameters = { id: string };
type DeleteResponseBody = { id: string };

export async function _delete(
  request: Request<
    DeleteParameters,
    DeleteResponseBody | ErrorResponse,
    void, // Request body
    void, // Query string
    Locals
  >,
  response: Response<DeleteResponseBody | ErrorResponse>
) {
  const { userId, role } = response.locals;
  const { id } = request.params;

  if (userId !== id && role !== 'admin') {
    return response.status(403).json({ message: 'Forbidden' });
  }

  if (!id) {
    return response.status(400).json({ message: 'Missing user id' });
  }

  try {
    const [body] = await database.delete(users).where(eq(users.id, id)).returning({ id: users.id });

    if (!body) {
      return response.status(404).json({ message: 'No data found.' });
    }

    return response.status(200).json(body);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}
