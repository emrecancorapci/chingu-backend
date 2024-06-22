import { Request, Response, NextFunction } from 'express';
import Jwt from 'jsonwebtoken';
import database from '@/config/database/drizzle.ts';
import { AuthToken } from '@/types.ts';

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
      return res.status(500).json({ message: 'JWT_SECRET is not defined.' });
    }

    const { id, username, role } = Jwt.verify(token, JWT_SECRET) as AuthToken;

    if (!id || !username || !role) {
      return res.status(401).json({ message: 'Not authorized. Invalid token.' });
    }

    const serverUser = await database.query.users.findFirst({
      where: ({ id: serverId, role: serverRole }, { and, eq }) =>
        and(eq(serverId, id), eq(serverRole, role)),
    });

    if (!serverUser) {
      return res.status(401).json({ message: 'Not authorized. User not found.' });
    }

    res.locals.user = { id, username, role };
    next();
  } catch (err) {
    if (err instanceof Jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Not authorized. Invalid token.' });
    }
    if (err instanceof Error) {
      return res.status(500).json({ message: err.message });
    }
    next(err);
  }
}
