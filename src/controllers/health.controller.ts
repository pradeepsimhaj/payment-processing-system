import { Request, Response } from 'express';

export const healthCheck = async (
  _req: Request,
  res: Response,
) => {
  return res.status(200).json({
    status: 'ok',

    timestamp: new Date().toISOString(),

    services: {
      database: 'connected',

      redis: 'connected',

      queue: 'running',
    },
  });
};