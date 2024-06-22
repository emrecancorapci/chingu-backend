import database from '@/config/database/drizzle.ts';
import { AuthToken } from '@/types.ts';
import { NextFunction, Request, Response, response } from 'express';
import Jwt from 'jsonwebtoken';

export default async function authenticationMiddleware(
  req: Request<unknown, unknown, unknown, unknown, { user: AuthToken }>,
  _: Response,
  next: NextFunction
) {
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

    const { id, username, role } = Jwt.verify(token, JWT_SECRET) as AuthToken;

    if (!id || !username || !role) {
      throw new Error('Not authorized. AuthToken is invalid.');
    }

    const serverUser = await database.query.user.findFirst({
      where: ({ id: serverId, role: serverRole }, { and, eq }) =>
        and(eq(serverId, id), eq(serverRole, role)),
    });

    if (!serverUser) {
      throw new Error('Not authorized. User not found.');
    }

    response.locals = { id, username, role };

    next();
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
  }
}
