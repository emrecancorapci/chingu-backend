import { Router } from 'express';
import { get, post, patch, _delete, getAll } from './controller.ts';
import { w } from '@/helpers/wrapper.ts';

const projectsRouter = Router();

projectsRouter.get('/', w(getAll));
projectsRouter.get('/:id', w(get));
projectsRouter.post('/', w(post));
projectsRouter.patch('/:id', w(patch));
projectsRouter.delete('/:id', w(_delete));

export { projectsRouter };
