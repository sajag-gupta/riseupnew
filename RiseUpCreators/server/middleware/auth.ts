import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No token provided in auth header");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.SESSION_SECRET || "your-secret-key-here", (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.sendStatus(403);
    }

    const decodedToken = decoded as any;
    console.log("Decoded token:", decodedToken);

    // Make sure we have the userId field from the token
    req.user = {
      id: decodedToken.userId || decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role,
      name: decodedToken.name
    };

    console.log("Set req.user:", req.user);
    next();
  });
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};