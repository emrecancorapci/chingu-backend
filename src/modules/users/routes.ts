import { Router } from 'express';
import { get, post, patch, _delete, getAll } from './controller.ts';

const usersRouter = Router();

usersRouter.get('/', getAll);
usersRouter.get('/:id', get);
usersRouter.post('/', post);
usersRouter.patch('/:id', patch);
usersRouter.delete('/:id', _delete);

export { usersRouter };
