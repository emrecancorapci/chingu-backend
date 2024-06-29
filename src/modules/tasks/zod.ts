import { tasks } from '@/config/database/schema.ts';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const id = z.string().uuid();
const title = z.string().min(3);
const description = z.string().nullable();
const priority = z.enum(['low', 'medium', 'high']).nullable();
const status = z.enum(['todo', 'working', 'finished']).default('todo');
const due_date = z.number().nullable();
const completed_at = z.number().nullable();
const project_id = z.string().uuid();

export const TaskGetResponse = createSelectSchema(tasks);
export const TaskPostRequest = createInsertSchema(tasks);
export const TaskPatchRequest = z.object({
  id,
  title: title.optional(),
  description: description.optional(),
  priority: priority.optional(),
  status: status.optional(),
  due_date: due_date.optional(),
  completed_at: completed_at.optional(),
});
export const TaskPatchResponse = z.object({
  id,
  title,
  description,
  priority,
  status,
  due_date,
  completed_at,
  project_id,
});
