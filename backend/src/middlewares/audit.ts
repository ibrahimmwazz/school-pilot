import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../services/db';

/**
 * Middleware to track sensitive mutations and save to the AuditLog.
 * @param actionName The name of the action being performed (e.g. "STUDENT_CSV_UPLOAD")
 */
export const auditLog = (actionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function (body) {
      // If the request was successful, log it
      if (res.statusCode >= 200 && res.statusCode < 400) {
        if (req.user && req.user.schoolId) {
          
          // Sanitize body to avoid storing passwords or huge files
          const safeBody = { ...req.body };
          if (safeBody.password) delete safeBody.password;
          
          prisma.auditLog.create({
            data: {
              schoolId: req.user.schoolId,
              userId: req.user.id,
              action: actionName,
              details: safeBody,
              ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
            }
          }).catch(err => console.error('Failed to write audit log:', err));
        }
      }
      return originalJson.apply(this, arguments as any);
    };
    
    next();
  };
};
