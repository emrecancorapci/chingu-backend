import database from '@/config/database/drizzle.ts';
import { Id, RequestParams, TableDate } from '@/types.ts';
import { Request, Response } from 'express';
import { TaskBody } from './types.ts';
import { tasks } from '@/config/database/schema.ts';
import { and, eq } from 'drizzle-orm';
import {
  BadRequestError,
  InternalServerError,
  NoDataFoundError,
} from '@/middlewares/error/base.ts';

type Task = TaskBody & TableDate & Id;

// GET
type GetResponseBody = { task: Task };

export async function get(request: Request, response: Response<GetResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id: taskId } = request.params;

  if (typeof userId !== 'string' || typeof role !== 'string') {
    throw new InternalServerError();
  }

  let task: Task | undefined;

  switch (role) {
    case 'admin': {
      task = await database.query.tasks.findFirst({
        where: ({ id }) => eq(id, taskId),
      });
      break;
    }
    case 'user': {
      task = await database.query.tasks.findFirst({
        where: ({ id: task_id, user_id }) => and(eq(user_id, userId), eq(task_id, taskId)),
      });
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }

  if (!task) {
    throw new NoDataFoundError();
  }

  return response.status(200).json({ task });
}

// GET ALL
type GetAllResponseBody = { tasks: Task[] };

export async function getAll(_: Request, response: Response<GetAllResponseBody>) {
  const { id: userId, role } = response.locals;

  if (typeof userId !== 'string' || typeof role !== 'string') {
    throw new InternalServerError();
  }

  let tasks: Task[] | undefined;

  switch (role) {
    case 'admin': {
      tasks = await database.query.tasks.findMany();
      break;
    }
    case 'user': {
      tasks = await database.query.tasks.findMany({
        where: ({ user_id }) => eq(user_id, userId),
      });
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }
  if (!tasks.length) {
    throw new NoDataFoundError();
  }

  return response.status(200).json({ tasks });
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
  request: Request<RequestParams, PostResponseBody, PostRequestBody>,
  response: Response<PostResponseBody>
) {
  const { id: userId } = response.locals;

  if (typeof userId !== 'string') {
    throw new InternalServerError();
  }

  const task = {
    title: request.body.title,
    description: request.body.description,
    priority: request.body.priority,
    due_date: request.body.due_date,
    user_id: userId,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const [insertedTask] = await database.insert(tasks).values(task).returning({ id: tasks.id });

  if (!insertedTask) {
    throw new InternalServerError();
  }

  response.status(201).json({ id: insertedTask.id });
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
  request: Request<RequestParams, PatchResponseBody, PatchRequestBody>,
  response: Response<PatchResponseBody>
) {
  const { id: userId } = response.locals;

  if (typeof userId !== 'string') {
    throw new InternalServerError();
  }

  const task = {
    ...request.body,
    updated_at: Date.now(),
  };

  const [updatedTask] = await database
    .update(tasks)
    .set(task)
    .where(and(eq(tasks.id, task.id), eq(tasks.user_id, userId)))
    .returning();

  if (!updatedTask) {
    throw new InternalServerError();
  }

  const { id, title, description, priority, due_date, completed_at } = updatedTask;

  response.status(200).json({ id, title, description, priority, due_date, completed_at });
}

// DELETE
type DeleteResponseBody = { id: string };

export async function deleteTask(request: Request, response: Response<DeleteResponseBody>) {
  const { id: userId } = response.locals;
  const { id } = request.params;

  if (typeof userId !== 'string') {
    throw new InternalServerError();
  }

  if (!id) {
    throw new BadRequestError('No id parameter');
  }

  const [body] = await database
    .delete(tasks)
    .where(and(eq(tasks.user_id, userId), eq(tasks.id, id)))
    .returning({ id: tasks.id });

  if (!body) {
    throw new NoDataFoundError();
  }

  response.status(200).json(body);
}
