import { Router } from 'express';
import { get, post, patch, _delete, getAll } from './controller.ts';
import { w } from '@/helpers/wrapper.ts';

const usersRouter = Router();

usersRouter.get('/', w(getAll));
usersRouter.get('/:id', w(get));
usersRouter.post('/', w(post));
usersRouter.patch('/:id', w(patch));
usersRouter.delete('/:id', w(_delete));

export { usersRouter };
