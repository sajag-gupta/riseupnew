import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import type { User } from '@shared/schema';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'rise-up-creators-jwt-secret';
  private jwtExpiry = '7d';

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiry });
  }

  verifyToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
    } catch (error) {
      return null;
    }
  }

  async register(email: string, password: string, name: string, role: 'fan' | 'artist' = 'fan'): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await storage.createUser({
      email,
      passwordHash,
      name,
      role,
    });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create artist profile if role is artist
    if (role === 'artist') {
      await storage.createArtist({
        userId: user.id,
      });
    }

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update last active
    await storage.updateUser(user.id, { lastActive: new Date() });

    return { user, token };
  }

  async getUserFromToken(token: string): Promise<User | null> {
    try {
      if (!token) return null;

      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const userId = decoded.id || decoded.userId || decoded.sub;

      if (!userId) {
        console.error('No user ID found in token');
        return null;
      }

      const user = await storage.getUser(userId);
      return user;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await storage.updateUser(user.id, { passwordHash });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user || !user.passwordHash) {
      throw new Error('User not found');
    }

    const isValidPassword = await this.comparePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await storage.updateUser(userId, { passwordHash });
  }
}

export const authService = new AuthService();