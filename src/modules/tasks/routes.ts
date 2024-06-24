import { Router } from 'express';
import { get, post, patch, deleteTask, getAll } from './controller.ts';
import { w } from '@/helpers/wrapper.ts';

const tasksRouter = Router();

tasksRouter.get('/', w(getAll));
tasksRouter.get('/:id', w(get));
tasksRouter.post('/', w(post));
tasksRouter.patch('/:id', w(patch));
tasksRouter.delete('/:id', w(deleteTask));

export { tasksRouter };
