import { Router } from 'express';
import { authRouter } from './modules/auth/routes.ts';
import { tasksRouter } from './modules/tasks/routes.ts';
import { usersRouter } from './modules/users/routes.ts';

const router = Router();

router.use('/auth', authRouter);
router.use('/tasks', tasksRouter);
router.use('/users', usersRouter);

export { router };