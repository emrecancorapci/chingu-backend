import { Request, Response, NextFunction } from 'express';
import Jwt from 'jsonwebtoken';
import database from '@/config/database/drizzle.ts';
import { JwtPayload } from '@/types.ts';
import { InternalServerError, UnauthorizedError } from './error/base.ts';

export default async function authenticationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided or malformed token.' });
  }

  const token = authorization.split(' ')[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      throw new InternalServerError();
    }

    const { id, username, role } = Jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!id || !username || !role) {
      throw new UnauthorizedError('Invalid token');
    }

    const serverUser = await database.query.users.findFirst({
      where: ({ id: serverId, role: serverRole }, { and, eq }) =>
        and(eq(serverId, id), eq(serverRole, role)),
    });

    if (!serverUser) {
      throw new UnauthorizedError('User not found');
    }

    res.locals.user = { id, username, role };
    next();
  } catch (err) {
    if (err instanceof Jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token.');
    }
    if (err instanceof Error) {
      throw new InternalServerError(err.message);
    }
    next(err);
  }
}
