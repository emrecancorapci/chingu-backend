import { Router } from 'express';
import { get, post, patch, deleteTask, getAll } from './controller.ts';

const tasksRouter = Router();

tasksRouter.get('/', getAll);
tasksRouter.get('/:id', get);
tasksRouter.post('/', post);
tasksRouter.patch('/:id', patch);
tasksRouter.delete('/:id', deleteTask);

export { tasksRouter };
