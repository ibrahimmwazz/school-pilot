import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  
  if (err.code === 'P0001') {
    // Custom PostgreSQL exception code used in our trigger
    return res.status(403).json({ error: 'Database constraint violation', message: err.message || 'Cannot modify locked records.' });
  }

  res.status(500).json({ error: 'Internal Server Error', message: err.message });
};
