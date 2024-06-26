import { Router } from 'express';
import { authRouter } from './modules/auth/routes.ts';
import { tasksRouter } from './modules/tasks/routes.ts';
import { usersRouter } from './modules/users/routes.ts';
import authMiddleware from './middlewares/auth.ts';

const router = Router();

router.use('/auth', authRouter);
router.use('/tasks', authMiddleware, tasksRouter);
router.use('/users', authMiddleware, usersRouter);

export { router };
