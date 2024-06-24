import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './base.ts';
import { NextFunction, Request, Response } from 'express';
import { PostgresError } from 'postgres';

interface CustomError extends Error {
  statusCode: number;
}

export default (
  err: CustomError,
  _: Request,
  res: Response<{ message: string }>,
  __: NextFunction
) => {
  if (err instanceof CustomAPIError)
    return res.status(err.statusCode).json({ message: err.message });

  if (err instanceof PostgresError) {
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'Invalid id' });
    }
  }

  console.error(err);

  return res
    .status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: 'Something went wrong. Please try again later.' });
};
