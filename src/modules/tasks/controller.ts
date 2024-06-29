import { Request, Response } from 'express';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';

import database from '@/config/database/drizzle.ts';
import { Data, RequestParams } from '@/types.ts';
import { projects, tasks } from '@/config/database/schema.ts';
import {
  BadRequestError,
  InternalServerError,
  NoDataFoundError,
} from '@/middlewares/error/base.ts';
import { TaskGetResponse, TaskPatchRequest, TaskPostRequest } from './zod.ts';

type TaskResponse = z.infer<typeof TaskGetResponse>;

// GET
type GetResponseBody = Data<TaskResponse>;

export async function get(request: Request, response: Response<GetResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id: idParam } = request.params;

  const taskId = z.string().length(40).parse(idParam);

  let data: TaskResponse | undefined;

  switch (role) {
    case 'admin': {
      [data] = await database.select().from(tasks).where(eq(tasks.id, taskId));
      break;
    }
    case 'user': {
      [{ task: data }] = await database
        .select()
        .from(tasks)
        .innerJoin(projects, eq(tasks.project_id, projects.id))
        .where(and(eq(projects.user_id, userId), eq(tasks.id, taskId)));
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }

  if (!data) throw new NoDataFoundError();

  return response.status(200).json({ data });
}

// GET ALL
type GetAllResponseBody = Data<TaskResponse[]>;

export async function getAll(_: Request, response: Response<GetAllResponseBody>) {
  const { id: userId, role } = response.locals;

  let data: TaskResponse[] | undefined;

  switch (role) {
    case 'admin': {
      data = await database.select().from(tasks);
      break;
    }
    case 'user': {
      {
        data;
      }
      [] = await database
        .select()
        .from(tasks)
        .innerJoin(projects, eq(tasks.project_id, projects.id))
        .where(eq(projects.user_id, userId));
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }

  if (!data || data.length === 0) throw new NoDataFoundError();

  return response.status(200).json({ data });
}

// POST
type PostResponseBody = Data<{ id: string }>;
type PostRequestBody = z.infer<typeof TaskPostRequest>;

export async function post(
  request: Request<RequestParams, PostResponseBody, PostRequestBody>,
  response: Response<PostResponseBody>
) {
  const { id: userId } = response.locals;

  const task = { ...(await TaskPostRequest.parseAsync(request.body)), user_id: userId };

  const [data] = await database.insert(tasks).values(task).returning({ id: tasks.id });

  if (!data) throw new InternalServerError();

  response.status(201).json({ data });
}

// PATCH
type PatchRequestBody = z.infer<typeof TaskPatchRequest>;
type PatchResponseBody = Data<TaskResponse>;

export async function patch(
  request: Request<RequestParams, PatchResponseBody, PatchRequestBody>,
  response: Response<PatchResponseBody>
) {
  const { id: userId, role } = response.locals;

  const task = await TaskPatchRequest.parseAsync(request.body);
  let data: TaskResponse | undefined;

  switch (role) {
    case 'admin': {
      [data] = await database.update(tasks).set(task).where(eq(tasks.id, task.id));
      break;
    }
    case 'user': {
      [data] = await database
        .update(tasks)
        .set(task)
        .where(
          and(
            eq(tasks.id, task.id),
            inArray(
              tasks.project_id,
              database
                .select({ id: projects.id })
                .from(projects)
                .where(eq(projects.user_id, userId))
            )
          )
        )
        .returning();
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }

  if (!data) throw new InternalServerError();

  response.status(200).json({ data });
}

// DELETE
type DeleteResponseBody = Data<{ id: string }>;

export async function deleteTask(request: Request, response: Response<DeleteResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id } = request.params;

  if (typeof userId !== 'string') throw new InternalServerError();
  if (!id) throw new BadRequestError('No id parameter');

  const taskId = z.string().length(40).parse(id);
  let data: { id: string } | undefined;

  switch (role) {
    case 'admin': {
      [data] = await database.delete(tasks).where(eq(tasks.id, taskId)).returning({ id: tasks.id });
      break;
    }
    case 'user': {
      [data] = await database
        .delete(tasks)
        .where(
          and(
            eq(tasks.id, taskId),
            inArray(
              tasks.project_id,
              database
                .select({ id: projects.id })
                .from(projects)
                .where(eq(projects.user_id, userId))
            )
          )
        )
        .returning({ id: tasks.id });
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }

  if (!data) throw new NoDataFoundError();

  response.status(200).json({ data });
}
