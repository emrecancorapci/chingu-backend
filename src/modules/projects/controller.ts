import database from '@/config/database/drizzle.ts';
import { Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { Data, RequestParams } from '@/types.ts';
import {
  BadRequestError,
  InternalServerError,
  NoDataFoundError,
} from '@/middlewares/error/base.ts';
import { z } from 'zod';
import { projects } from '@/config/database/schema.ts';
import {
  ProjectGetResponse,
  ProjectPatchRequest,
  ProjectPatchResponse,
  ProjectPostRequest,
} from './zod.ts';

// GET
type GetResponse = z.infer<typeof ProjectGetResponse>;
type GetResponseBody = Data<GetResponse>;

export async function get(request: Request, response: Response<GetResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id: idParam } = request.params;

  if (typeof userId !== 'string' || typeof role !== 'string') throw new InternalServerError();

  const projectId = z.string().length(40).parse(idParam);

  let data: GetResponse | undefined;

  switch (role) {
    case 'admin': {
      [data] = await database.select().from(projects).where(eq(projects.id, projectId));
      break;
    }
    case 'user': {
      [data] = await database
        .select()
        .from(projects)
        .where(and(eq(projects.user_id, userId), eq(projects.id, projectId)));
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
type GetAllResponseBody = Data<GetResponse[]>;

export async function getAll(_: Request, response: Response<GetAllResponseBody>) {
  const { id: userId, role } = response.locals;

  let data: GetResponse[] = [];

  switch (role) {
    case 'admin': {
      data = await database.select().from(projects);
      break;
    }
    case 'user': {
      data = await database.select().from(projects).where(eq(projects.user_id, userId));
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }

  if (data.length === 0) throw new NoDataFoundError();

  return response.status(200).json({ data });
}

// POST
type PostResponseBody = Data<{ id: string }>;
type PostRequestBody = z.infer<typeof ProjectPostRequest>;

export async function post(
  request: Request<RequestParams, PostResponseBody, PostRequestBody>,
  response: Response<PostResponseBody>
) {
  const { id } = response.locals;

  const project = { ...(await ProjectPostRequest.parseAsync(request.body)), user_id: id };

  const [data] = await database.insert(projects).values(project).returning({ id: projects.id });

  if (!data) {
    throw new InternalServerError();
  }

  return response.status(201).json({ data });
}

// PATCH
type PatchResponse = z.infer<typeof ProjectPatchResponse>;
type PatchResponseBody = Data<PatchResponse>;
type PatchRequestBody = z.infer<typeof ProjectPatchRequest>;

export async function patch(
  request: Request<RequestParams, PatchResponseBody, PatchRequestBody>,
  response: Response<PatchResponseBody>
) {
  const { id: userId, role } = response.locals;

  let project = await ProjectPatchRequest.parseAsync(request.body);

  let data: PatchResponse;

  switch (role) {
    case 'admin': {
      [data] = await database
        .update(projects)
        .set(project)
        .where(eq(projects.id, project.id))
        .returning({ id: projects.id, name: projects.name, description: projects.description });
      break;
    }
    case 'user': {
      [data] = await database
        .update(projects)
        .set(project)
        .where(and(eq(projects.user_id, userId), eq(projects.id, project.id)))
        .returning({ id: projects.id, name: projects.name, description: projects.description });
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }

  if (!data) {
    throw new NoDataFoundError();
  }

  return response.status(200).json({ data });
}

// DELETE
type DeleteResponseBody = Data<{ id: string }>;

export async function _delete(request: Request, response: Response<DeleteResponseBody>) {
  const { id: userId, role } = response.locals;
  const { id: idParam } = request.params;

  const parsedId = await z.string().uuid().parseAsync(idParam);

  let data: { id: string };

  switch (role) {
    case 'admin': {
      [data] = await database
        .delete(projects)
        .where(eq(projects.id, parsedId))
        .returning({ id: projects.id });

      break;
    }
    case 'user': {
      [data] = await database
        .delete(projects)
        .where(and(eq(projects.id, parsedId), eq(projects.user_id, userId)))
        .returning({ id: projects.id });
      break;
    }
    default: {
      throw new BadRequestError('Token is corrupted');
    }
  }

  if (!data) {
    throw new NoDataFoundError();
  }

  return response.status(200).json({ data });
}
