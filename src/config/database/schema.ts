import { relations } from 'drizzle-orm';
import { bigint, pgSchema, smallserial, uuid, varchar } from 'drizzle-orm/pg-core';

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

export const userRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const priority = schema.enum('priority', ['low', 'medium', 'high']);
export const status = schema.enum('status', ['todo', 'working', 'finished']);
export const tasks = schema.table('task', {
  id: uuid('id').defaultRandom().primaryKey(),
  project_id: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
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

export const taskRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id],
  }),
}));

export const projects = schema.table('project', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
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

export const projectRelations = relations(projects, ({ many, one }) => ({
  tasks: many(tasks),
  user: one(users, {
    fields: [projects.user_id],
    references: [users.id],
  }),
}));
