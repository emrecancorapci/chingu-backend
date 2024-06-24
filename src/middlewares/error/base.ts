import { StatusCodes } from 'http-status-codes';

export default class CustomAPIError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends CustomAPIError {
  statusCode;

  constructor(message?: string) {
    super(message || 'Bad Request');
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends CustomAPIError {
  statusCode;

  constructor(message?: string) {
    super(message || 'Unauthorized');
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends CustomAPIError {
  statusCode;

  constructor(message?: string) {
    super(message || 'Cannot be accessed with current role');
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

/**
 * 404 No data found
 */
export class NoDataFoundError extends CustomAPIError {
  statusCode;

  constructor(message?: string) {
    super(message || 'No data found');
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends CustomAPIError {
  statusCode;

  constructor(message?: string) {
    super(message || 'Conflict');
    this.statusCode = StatusCodes.CONFLICT;
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends CustomAPIError {
  statusCode;

  constructor(message?: string) {
    super(message || 'Internal Server Error');
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}
