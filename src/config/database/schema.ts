import { bigint, pgSchema, uuid, varchar } from 'drizzle-orm/pg-core';

export const schema = pgSchema('task_manager')

export const priority = schema.enum('priority', ['low', 'medium', 'high']);

export const tasks = schema.table('task', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 128 }).notNull(),
  description: varchar('description'),
  priority: priority('priority'),
  created_at: bigint('created_at', { mode: 'number' }).notNull(),
  updated_at: bigint('updated_at', { mode: 'number' }).notNull(),
  completed_at: bigint('completed_at', { mode: 'number' }),
  due_date: bigint('due_date', { mode: 'number' }),
  userId: uuid('user_id')
    .references(() => user.id)
    .notNull(),
});

export const user = schema.table('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 128 }).notNull(),
  password: varchar('password', { length: 128 }).notNull(),
  username: varchar('username', { length: 128 }).notNull(),
  created_at: bigint('created_at', { mode: 'number' }).notNull(),
  updated_at: bigint('updated_at', { mode: 'number' }).notNull(),
});
