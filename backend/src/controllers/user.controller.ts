import { Response } from 'express';
import { AuthRequest, UserRole } from '../types';
import { UserModel } from '../models/user.model';

export class UserController {
  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const users = await UserModel.findAll();
      res.json(users);
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  static async getUserById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(UserModel.toDTO(user));
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  static async createUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { username, password, role } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role required' });
      }

      if (!['player', 'gm', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if username exists
      const existing = await UserModel.findByUsername(username);
      if (existing) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      const user = await UserModel.create(username, password, role as UserRole);

      res.status(201).json(user);
    } catch (error: any) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const { role, password } = req.body;

      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (role) {
        if (!['player', 'gm', 'admin'].includes(role)) {
          return res.status(400).json({ error: 'Invalid role' });
        }
        await UserModel.updateRole(id, role as UserRole);
      }

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        await UserModel.updatePassword(id, password);
      }

      const updated = await UserModel.findById(id);
      res.json(UserModel.toDTO(updated!));
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      // Prevent deleting yourself
      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const success = await UserModel.delete(id);

      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}
