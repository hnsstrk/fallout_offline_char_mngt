import { Response } from 'express';
import { AuthRequest, LoginCredentials } from '../types';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/user.model';

export class AuthController {
  static async login(req: AuthRequest, res: Response) {
    try {
      const credentials: LoginCredentials = req.body;

      if (!credentials.username || !credentials.password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login(credentials, ipAddress, userAgent);

      res.json(result);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message || 'Login failed' });
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    try {
      if (req.sessionId) {
        await AuthService.logout(req.sessionId);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get fresh user data
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(UserModel.toDTO(user));
    } catch (error: any) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user data' });
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      // Verify current password
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await UserModel.verifyPassword(user, currentPassword);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Update password
      await UserModel.updatePassword(req.user.id, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
}
