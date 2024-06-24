import { z } from 'zod';

export const TaskBody = z.object({
  title: z.string().min(3),
  description: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high']).nullable(),
  status: z.enum(['todo', 'working', 'finished']),
  due_date: z.number().nullable(),
  completed_at: z.number().nullable(),
  user_id: z.string().length(40),
  project_id: z.string().length(40),
});

export const HasId = z.object({
  id: z.string().length(40),
})

export const HasDates = z.object({
  created_at: z.number(),
  updated_at: z.number(),
})