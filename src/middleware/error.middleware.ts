import { Request, Response, NextFunction } from 'express';

import { ZodError } from 'zod';

import logger from '../config/logger';

export function errorMiddleware(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error(error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      errors: error.issues,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
}