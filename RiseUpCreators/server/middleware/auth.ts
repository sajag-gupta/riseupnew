import { Request, Response, NextFunction } from "express";
import { authService } from "../auth";

const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "token";

export interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  isAuthenticated?: () => boolean;
}

const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  return req.cookies?.[JWT_COOKIE_NAME] || null;
};

/** Authenticate JWT tokens */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ message: "Authorization token required" });

    const user = await authService.getUserFromToken(token);
    if (!user) return res.status(401).json({ message: "Invalid or expired token" });

    req.user = user;
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ message: "Authentication failed" });
  }
};

/** Optional auth — attach user if valid, else continue */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      const user = await authService.getUserFromToken(token);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    next();
  } catch {
    next();
  }
};

/** Require role(s) */
export const requireRole = (roles: string | string[]) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowed.includes(req.user.role))
      return res.status(403).json({ message: "Insufficient permissions" });
    next();
  };
};

export const requireArtist = requireRole("artist");
export const requireAdmin = requireRole("admin");

/** Ownership or admin */
export const requireOwnershipOrAdmin =
  (resourceField: string = "userId") =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role === "admin") return next();

    const ownerId = req.params[resourceField] || req.body[resourceField];
    if (ownerId && ownerId !== req.userId)
      return res.status(403).json({ message: "Access denied" });

    next();
  };

/** Active account check */
export const requireActiveAccount = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (["suspended", "banned"].includes(req.user.status))
    return res.status(403).json({ message: `Account ${req.user.status}` });
  next();
};

/** Verified artist */
export const requireVerifiedArtist = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "artist")
    return res.status(403).json({ message: "Artist account required" });
  if (!req.user.isVerified)
    return res.status(403).json({ message: "Artist verification required" });
  next();
};
