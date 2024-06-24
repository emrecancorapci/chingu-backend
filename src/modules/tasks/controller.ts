import database from '@/config/database/drizzle.ts';
import { ErrorResponse, Id, TableDate, AuthLocal } from '@/types.ts';
import { NextFunction, Request, Response } from 'express';
import { TaskBody } from './types.ts';
import { tasks } from '@/config/database/schema.ts';
import { and, eq } from 'drizzle-orm';
import {
  BadRequestError,
  InternalServerError,
  NoDataFoundError,
} from '@/middlewares/error/base.ts';

// GET
type Task = TaskBody & TableDate & Id;
type GetParameters = { id: string };
type GetResponseBody = { task: Task };

export async function get(
  request: Request<GetParameters>,
  response: Response<GetResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { id: userId, role },
  } = response.locals;
  const { id: taskId } = request.params;

  let task: Task | undefined;

  try {
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
  } catch (error) {
    next(error);
  }
}

// GET ALL
type GetAllResponseBody = { tasks: Task[] };

export async function getAll(
  _: Request,
  response: Response<GetAllResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { id: userId, role },
  } = response.locals;

  let tasks: Task[] | undefined;

  try {
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
  } catch (error) {
    next(error);
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
    PostRequestBody
  >,
  response: Response<PostResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { id: userId },
  } = response.locals;
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
    const [insertedTask] = await database.insert(tasks).values(task).returning({ id: tasks.id });

    if (!insertedTask) {
      throw new InternalServerError();
    }

    response.status(201).json({ id: insertedTask.id });
  } catch (error) {
    next(error);
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
    PatchRequestBody
  >,
  response: Response<PatchResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { id: userId },
  } = response.locals;
  const task = {
    ...request.body,
    updated_at: Date.now(),
  };

  try {
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
  } catch (error) {
    next(error);
  }
}

// DELETE
type DeleteParameters = { id: string };
type DeleteResponseBody = { id: string };

export async function deleteTask(
  request: Request<DeleteParameters>,
  response: Response<DeleteResponseBody | ErrorResponse, AuthLocal>,
  next: NextFunction
) {
  const {
    user: { id: userId },
  } = response.locals;
  const { id } = request.params;

  if (!id) {
    throw new BadRequestError('No id parameter');
  }

  try {
    const [body] = await database
      .delete(tasks)
      .where(and(eq(tasks.user_id, userId), eq(tasks.id, id)))
      .returning({ id: tasks.id });

    if (!body) {
      throw new NoDataFoundError();
    }

    response.status(200).json(body);
  } catch (error) {
    next(error);
  }
}
