import database from '@/config/database/drizzle.ts';
import { AuthToken, ErrorResponse } from '@/types.ts';
import { Request, Response } from 'express';
import { TaskBody, WithId } from './types.ts';
import { tasks } from '@/config/database/schema.ts';
import { and, eq } from 'drizzle-orm';

type Locals = { user: AuthToken };

// GET
type Task = TaskBody & WithId;
type GetParameters = { id?: string };
type GetResponseBody = { tasks: Task[] };

export async function get(
  request: Request<GetParameters, GetResponseBody | ErrorResponse, void, void, Locals>,
  response: Response<GetResponseBody | ErrorResponse>
) {
  const { userId } = response.locals;
  const { id } = request.params;

  const data: Task[] = await database.query.tasks
    .findMany({
      where: ({ id: taskId, userId: taskUserId }, { eq, and }) => {
        return id != undefined
          ? and(eq(taskUserId, userId), eq(taskId, id))
          : eq(taskUserId, userId);
      },
    })
    .catch((error) => {
      throw new Error(error);
    });

  if (data.length === 0) {
    return response.status(200).json({ tasks: [] });
  }

  response.status(200).json({ tasks: data });
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
  request: Request<void, PostResponseBody | ErrorResponse, PostRequestBody, void, Locals>,
  response: Response<PostResponseBody | ErrorResponse>
) {
  const { userId } = response.locals;
  const task = { ...request.body, userId, created_at: Date.now(), updated_at: Date.now() };

  const databaseResponse = await database
    .insert(tasks)
    .values(task)
    .returning({ id: tasks.id })
    .catch((error) => {
      throw new Error(error);
    });

  response.status(201).json({ id: databaseResponse[0].id });
}

// PATCH
type PatchBody = {
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  due_date: number | null;
} & WithId;

type PatchResponseBody = PatchBody;
type PatchRequestBody = PatchBody;

export async function patch(
  request: Request<void, PatchResponseBody | ErrorResponse, PatchRequestBody, void, Locals>,
  response: Response<PatchResponseBody | ErrorResponse>
) {
  const { userId } = response.locals;
  const task = { ...request.body, userId: userId, updated_at: Date.now() };

  const [{ id, title, description, priority, due_date }] = await database
    .update(tasks)
    .set(task)
    .where(and(eq(tasks.id, task.id), eq(tasks.userId, userId)))
    .returning()
    .catch((error) => {
      throw new Error(error);
    });

  response.status(201).json({ id, title, description, priority, due_date });
}

// DELETE
type DeleteParameters = { id: string };
type DeleteResponseBody = { id: string };

export async function deleteTask(
  request: Request<
    DeleteParameters,
    DeleteResponseBody | ErrorResponse,
    void,
    void,
    Locals
  >,
  response: Response<DeleteResponseBody | ErrorResponse>
) {
  const { userId } = response.locals;
  const { id } = request.params;

  if (!id) {
    return response.status(400).json({ message: 'Missing task id' });
  }

  const [body] = await database
    .delete(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, id)))
    .returning({ id: tasks.id })
    .catch((error) => {
      throw new Error(error);
    });

  response.status(200).json(body);
}
