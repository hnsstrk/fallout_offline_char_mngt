import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, JWTPayload, UserDTO } from '../types';
import { UserModel } from '../models/user.model';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Verify user still exists and is valid
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login,
    };
    req.sessionId = decoded.sessionId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      const user = await UserModel.findById(decoded.userId);

      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          created_at: user.created_at,
          last_login: user.last_login,
        };
        req.sessionId = decoded.sessionId;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
