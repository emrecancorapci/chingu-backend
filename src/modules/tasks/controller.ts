import database from '@/config/database/drizzle.ts';
import { AuthToken, ErrorResponse, Id, TableDate } from '@/types.ts';
import { Request, Response } from 'express';
import { TaskBody } from './types.ts';
import { tasks } from '@/config/database/schema.ts';
import { and, eq } from 'drizzle-orm';

type Locals = { user: AuthToken };

// GET
type Task = TaskBody & TableDate & Id;
type GetParameters = { id: string };
type GetResponseBody = { task: Task };

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
  const { id: paramTaskId } = request.params;

  try {
    switch (role) {
      case 'admin': {
        const task: Task | undefined = await database.query.tasks.findFirst({
          where: ({ id }) => eq(id, paramTaskId),
        });

        if (!task) {
          return response.status(404).json({ message: 'No data found.' });
        }

        return response.status(200).json({ task });
      }
      case 'user': {
        const task: Task | undefined = await database.query.tasks.findFirst({
          where: ({ id: task_id, user_id }) =>
            and(eq(user_id, userId), eq(task_id, paramTaskId)),
        });

        if (!task) {
          return response.status(404).json({ message: 'No data found.' });
        }

        return response.status(200).json({ task });
      }
      default: {
        return response.status(400).json({ message: 'Token is corrupted' });
      }
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}

// GET ALL
type GetAllResponseBody = { tasks: Task[] };

export async function getAll(
  _: Request<
    void, // Request Parameters
    GetAllResponseBody | ErrorResponse,
    void, // Request Body
    void, // Request Query
    Locals
  >,
  response: Response<GetAllResponseBody | ErrorResponse>
) {
  const { userId, role } = response.locals;

  try {
    switch (role) {
      case 'admin': {
        const tasks: Task[] = await database.query.tasks.findMany();

        if (!tasks.length) {
          return response.status(404).json({ message: 'No data found.' });
        }

        return response.status(200).json({ tasks });
      }
      case 'user': {
        const tasks: Task[] = await database.query.tasks.findMany({
          where: ({ user_id }) => eq(user_id, userId),
        });

        if (!tasks.length) {
          return response.status(404).json({ message: 'No data found.' });
        }

        return response.status(200).json({ tasks });
      }
      default: {
        return response.status(400).json({ message: 'Token is corrupted' });
      }
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}

// POST
type PostResponseBody = { id: string };
type PostRequestBody = {
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  due_date: number | null;
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
  const { userId } = response.locals;
  const task = {
    title: request.body.title,
    description: request.body.description,
    priority: request.body.priority,
    due_date: request.body.due_date,
    user_id: userId,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  try {
    const databaseResponse = await database
      .insert(tasks)
      .values(task)
      .returning({ id: tasks.id });

    response.status(201).json({ id: databaseResponse[0].id });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}

// PATCH
type PatchBody = {
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  due_date?: number | null;
  completed_at?: number | null;
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
  const { userId } = response.locals;
  const task = {
    ...request.body,
    updated_at: Date.now(),
  };

  try {
    const [{ id, title, description, priority, due_date, completed_at }] = await database
      .update(tasks)
      .set(task)
      .where(and(eq(tasks.id, task.id), eq(tasks.user_id, userId)))
      .returning();

    response.status(200).json({ id, title, description, priority, due_date, completed_at });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}

// DELETE
type DeleteParameters = { id: string };
type DeleteResponseBody = { id: string };

export async function deleteTask(
  request: Request<
    DeleteParameters,
    DeleteResponseBody | ErrorResponse,
    void, // Request body
    void, // Query string
    Locals
  >,
  response: Response<DeleteResponseBody | ErrorResponse>
) {
  const { userId } = response.locals;
  const { id } = request.params;

  if (!id) {
    return response.status(400).json({ message: 'Missing task id' });
  }

  try {
    const [body] = await database
      .delete(tasks)
      .where(and(eq(tasks.user_id, userId), eq(tasks.id, id)))
      .returning({ id: tasks.id });

    if (!body) {
      return response.status(404).json({ message: 'No data found.' });
    }

    response.status(200).json(body);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}
