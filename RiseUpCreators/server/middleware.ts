import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth';
import type { User } from '@shared/schema';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const user = await authService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      const user = await authService.getUserFromToken(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors || error.message,
      });
    }
  };
};

export const rateLimiter = (windowMs: number, max: number) => {
  const requests = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const requestTimes = requests.get(key).filter((time: number) => time > windowStart);
    
    if (requestTimes.length >= max) {
      return res.status(429).json({ message: 'Too many requests' });
    }

    requestTimes.push(now);
    requests.set(key, requestTimes);
    next();
  };
};

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: error.errors,
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (error.name === 'ForbiddenError') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (error.name === 'NotFoundError') {
    return res.status(404).json({ message: 'Not found' });
  }

  return res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
