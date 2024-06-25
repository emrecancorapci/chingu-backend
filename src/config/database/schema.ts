import { relations } from 'drizzle-orm';
import { bigint, pgSchema, uuid, varchar } from 'drizzle-orm/pg-core';

export const schema = pgSchema('task_manager');

export const userRole = schema.enum('role', ['admin', 'user']);

export const users = schema.table('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 128 }).notNull(),
  username: varchar('username', { length: 128 }).notNull(),
  password: varchar('password', { length: 128 }).notNull(),
  role: userRole('role').default('user').notNull(),
  created_at: bigint('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  updated_at: bigint('updated_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now()),
});

export const priority = schema.enum('priority', ['low', 'medium', 'high']);
export const status = schema.enum('status', ['todo', 'working', 'finished']);

export const tasks = schema.table('task', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  project_id: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  title: varchar('title', { length: 128 }).notNull(),
  description: varchar('description'),
  priority: priority('priority'),
  status: status('status').notNull().default('todo'),
  due_date: bigint('due_date', { mode: 'number' }),
  completed_at: bigint('completed_at', { mode: 'number' }),
  created_at: bigint('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  updated_at: bigint('updated_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now()),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id],
  }),
}));

export const projects = schema.table('project', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  description: varchar('description'),
  created_at: bigint('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  updated_at: bigint('updated_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now()),
});

export const projectRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
}));
