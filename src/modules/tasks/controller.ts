import database from '@/config/database/drizzle.ts';
import { RequestParams } from '@/types.ts';
import { Request, Response } from 'express';
import { tasks } from '@/config/database/schema.ts';
import { and, eq } from 'drizzle-orm';
import {
  BadRequestError,
  InternalServerError,
  NoDataFoundError,
} from '@/middlewares/error/base.ts';
import { z } from 'zod';
import { HasDates, HasId, TaskBody } from './zod.ts';

const TaskFull = TaskBody.merge(HasId).merge(HasDates);
type TaskResponse = z.infer<typeof TaskFull>;

// GET
type GetResponseBody = { task: TaskResponse };

export async function get(request: Request, response: Response<GetResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id: taskId } = request.params;

  if (typeof userId !== 'string' || typeof role !== 'string') {
    throw new InternalServerError();
  }

  let task: TaskResponse | undefined;

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
type GetAllResponseBody = { tasks: TaskResponse[] };

export async function getAll(_: Request, response: Response<GetAllResponseBody>) {
  const { id: userId, role } = response.locals;

  if (typeof userId !== 'string' || typeof role !== 'string') {
    throw new InternalServerError();
  }

  let tasks: TaskResponse[] | undefined;

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

  if (tasks.length === 0) {
    throw new NoDataFoundError();
  }

  return response.status(200).json({ tasks });
}

// POST
type PostResponseBody = { id: string };
type PostRequestBody = z.infer<typeof TaskBody>;

export async function post(
  request: Request<RequestParams, PostResponseBody, PostRequestBody>,
  response: Response<PostResponseBody>
) {
  const { id: userId } = response.locals;

  if (typeof userId !== 'string') {
    throw new InternalServerError();
  }

  const task = await TaskBody.parseAsync(request.body);

  const [insertedTask] = await database
    .insert(tasks)
    .values(task)
    .returning({ id: tasks.id })
    .catch((error) => {
      throw new Error(error);
    });

  if (!insertedTask) {
    throw new InternalServerError();
  }

  response.status(201).json({ id: insertedTask.id });
}

// PATCH
const TaskWithId = TaskBody.partial().merge(HasId);
type PatchBody = z.infer<typeof TaskWithId>;
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

  const newTask = await TaskWithId.parseAsync(request.body);

  const [updatedTask] = await database
    .update(tasks)
    .set(newTask)
    .where(and(eq(tasks.id, newTask.id), eq(tasks.user_id, userId)))
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

  const taskId = z.string().length(40).parse(id);

  const [body] = await database
    .delete(tasks)
    .where(and(eq(tasks.user_id, userId), eq(tasks.id, taskId)))
    .returning({ id: tasks.id });

  if (!body) {
    throw new NoDataFoundError();
  }

  response.status(200).json(body);
}
