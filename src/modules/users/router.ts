import { Router } from 'express';
import { get, post, patch, _delete, getAll } from './controller.ts';

const tasksRouter = Router();

tasksRouter.get('/', getAll);
tasksRouter.get('/:id', get);
tasksRouter.post('/', post);
tasksRouter.patch('/:id', patch);
tasksRouter.delete('/:id', _delete);

export { tasksRouter };
