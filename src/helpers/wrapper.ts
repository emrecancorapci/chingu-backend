import { NextFunction, Request, RequestHandler, Response } from 'express';

export function w(
  fn: (request: Request, response: Response, next: NextFunction) => Promise<Response | void>,
): RequestHandler {
  return (request, response, next) => {
    return fn(request, response, next).catch(next);
  };
}
