import { z } from 'zod';

const id = z.string().uuid();
const user_id = z.string().uuid();
const name = z.string().max(128);
const description = z.string().nullable();

export const ProjectGetResponse = z.object({
  id,
  user_id,
  name,
  description,
  created_at: z.number(),
  updated_at: z.number(),
});

export const ProjectPostRequest = z.object({
  name,
  description,
});

export const ProjectPatchRequest = z.object({
  id,
  name: name.optional(),
  description: description.optional(),
});

export const ProjectPatchResponse = z.object({
  id,
  name,
  description,
});
