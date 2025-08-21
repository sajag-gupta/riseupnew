import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

export interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await storage.getUser(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      res.status(500).json({ message: 'Authentication error' });
    }
  }
};

/**
 * Middleware to check if user is authenticated (works with both session and JWT)
 */
export const isAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check session-based auth first (for Replit auth)
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user as any;
      if (user && user.claims) {
        // Get user from database using Replit ID
        const dbUser = await storage.getUser(user.claims.sub);
        if (dbUser) {
          req.user = dbUser;
          req.userId = dbUser.id;
          return next();
        }
      }
    }

    // Check JWT token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await storage.getUser(decoded.userId);

        if (user) {
          req.user = user;
          req.userId = user.id;
          return next();
        }
      } catch (jwtError) {
        // JWT verification failed, continue to unauthorized
      }
    }

    res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

/**
 * Middleware to check if user is an artist
 */
export const requireArtist = requireRole('artist');

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Admin can access anything
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (resourceUserId && resourceUserId !== req.userId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

/**
 * Middleware to check if user can access artist content
 */
export const canAccessArtistContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const artistId = req.params.artistId;
    const contentVisibility = req.body.visibility || req.query.visibility;

    // Public content is accessible to everyone
    if (contentVisibility === 'public') {
      return next();
    }

    // Must be authenticated for subscriber-only content
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Artist can access their own content
    if (req.user.role === 'artist') {
      const artistProfile = await storage.getArtistByUserId(req.userId!);
      if (artistProfile && artistProfile.id === artistId) {
        return next();
      }
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has subscription to artist for subscriber-only content
    if (contentVisibility === 'subscriber_only') {
      const subscriptions = await storage.getSubscriptionsByUser(req.userId!);
      const hasSubscription = subscriptions.some(
        (sub: any) => sub.artistId === artistId && sub.status === 'active'
      );

      if (!hasSubscription) {
        res.status(403).json({ message: 'Subscription required' });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Content access check error:', error);
    res.status(500).json({ message: 'Authorization error' });
  }
};

/**
 * Middleware to rate limit requests per user
 */
export const rateLimitByUser = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  const userRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId || req.ip;
      const now = Date.now();

      const userRecord = userRequestCounts.get(userId);

      if (!userRecord || now > userRecord.resetTime) {
        userRequestCounts.set(userId, {
          count: 1,
          resetTime: now + windowMs,
        });
        return next();
      }

      if (userRecord.count >= maxRequests) {
        res.status(429).json({
          message: 'Too many requests',
          retryAfter: Math.ceil((userRecord.resetTime - now) / 1000),
        });
        return;
      }

      userRecord.count++;
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Don't block request on rate limiter error
    }
  };
};

/**
 * Middleware to check if user account is active
 */
export const requireActiveAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if account is suspended or banned
    if (req.user.status === 'suspended') {
      res.status(403).json({ message: 'Account suspended' });
      return;
    }

    if (req.user.status === 'banned') {
      res.status(403).json({ message: 'Account banned' });
      return;
    }

    next();
  } catch (error) {
    console.error('Account status check error:', error);
    res.status(500).json({ message: 'Authorization error' });
  }
};

/**
 * Middleware to check if artist is verified
 */
export const requireVerifiedArtist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'artist') {
      res.status(403).json({ message: 'Artist account required' });
      return;
    }

    if (!req.user.isVerified) {
      res.status(403).json({ message: 'Artist verification required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Artist verification check error:', error);
    res.status(500).json({ message: 'Authorization error' });
  }
};

/**
 * Optional authentication - doesn't fail if not authenticated
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check session-based auth first
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user as any;
      if (user && user.claims) {
        const dbUser = await storage.getUser(user.claims.sub);
        if (dbUser) {
          req.user = dbUser;
          req.userId = dbUser.id;
        }
      }
    } else {
      // Check JWT token
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          const user = await storage.getUser(decoded.userId);

          if (user) {
            req.user = user;
            req.userId = user.id;
          }
        } catch (jwtError) {
          // JWT verification failed, but that's okay for optional auth
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Don't fail the request for optional auth errors
    next();
  }
};
