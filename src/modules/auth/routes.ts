import { Router } from 'express';
import { login, register } from './controller.ts';
import { w } from '@/helpers/wrapper.ts';

const authRouter = Router();

authRouter.post('/login', w(login));
authRouter.post('/register', w(register));

export { authRouter };
