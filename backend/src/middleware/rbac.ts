import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireGMOrAdmin = requireRole('gm', 'admin');
export const requireAnyRole = requireRole('player', 'gm', 'admin');

// Check if user can access a specific character
export const canAccessCharacter = (requireEdit: boolean = false) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const characterId = req.params.characterId || req.params.id;

    if (!characterId) {
      return res.status(400).json({ error: 'Character ID required' });
    }

    // Admin and GM have full access to all characters
    if (req.user.role === 'admin' || req.user.role === 'gm') {
      return next();
    }

    // For players, we need to check ownership
    // This will be validated in the controller/service layer
    // Here we just ensure they're authenticated
    next();
  };
};
