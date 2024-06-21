import { AuthToken } from '@/types.ts';
import { NextFunction, Request, Response, response } from 'express';
import Jwt from 'jsonwebtoken';

export default (
  req: Request<unknown, unknown, unknown, unknown, { user: AuthToken }>,
  _: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer')) {
    throw new Error('No token provided.');
  }
  const token = authorization.split(' ')[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const { id, name } = Jwt.verify(token, JWT_SECRET) as AuthToken;

    if (!id || !name) {
      throw new Error('Not authorized. AuthToken is invalid.');
    }

    response.locals = { id, name };

    next();
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
  }
};
