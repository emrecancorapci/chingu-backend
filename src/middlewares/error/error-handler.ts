import { StatusCodes } from 'http-status-codes';
import CustomAPIError from './base.ts';
import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodIssue } from 'zod';

interface CustomError extends Error {
  statusCode: number;
}

export default (
  error: CustomError,
  _: Request,
  res: Response<{ message: string, errors?: string[] }>,
  __: NextFunction
) => {
  if (error instanceof CustomAPIError)
    return res.status(error.statusCode).json({ message: error.message });

  if ('code' in error) {
    switch (error.code) {
      case '22P02': {
        return res.status(400).json({ message: 'Invalid id' });
      }
    }
  }

  if (error instanceof ZodError) {
    const errorMessages = error.errors.map(
      (issue: ZodIssue) => `${issue.path.join('.')} is ${issue.message.toLowerCase()}`
    );

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Invalid data', errors: errorMessages });
  }

  console.error(error);

  return res
    .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: 'Something went wrong. Please try again later.' });
};
