import { Response } from 'express';
import { AuthRequest } from '../types';
import { ChangeLogModel } from '../models/changelog.model';
import { CharacterService } from '../services/character.service';

export class ChangeLogController {
  static async getChangeLogsByCharacter(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { characterId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const canAccess = await CharacterService.canUserAccessCharacter(
        req.user.id,
        req.user.role,
        characterId
      );

      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const logs = await ChangeLogModel.findByCharacterId(characterId, limit, offset);
      const total = await ChangeLogModel.getCountByCharacterId(characterId);

      res.json({
        logs,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + logs.length < total,
        },
      });
    } catch (error: any) {
      console.error('Get change logs error:', error);
      res.status(500).json({ error: 'Failed to get change logs' });
    }
  }

  static async getAllChangeLogs(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Only GM and Admin can see all logs
      if (req.user.role !== 'gm' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await ChangeLogModel.findAll(limit);

      res.json({ logs });
    } catch (error: any) {
      console.error('Get all change logs error:', error);
      res.status(500).json({ error: 'Failed to get change logs' });
    }
  }

  static async exportChangeLog(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { characterId } = req.params;
      const format = (req.query.format as string) || 'csv';

      const canAccess = await CharacterService.canUserAccessCharacter(
        req.user.id,
        req.user.role,
        characterId
      );

      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const logs = await ChangeLogModel.findByCharacterId(characterId, 1000, 0);

      if (format === 'csv') {
        const csv = this.generateCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="changelog-${characterId}.csv"`);
        res.send(csv);
      } else {
        res.json(logs);
      }
    } catch (error: any) {
      console.error('Export change log error:', error);
      res.status(500).json({ error: 'Failed to export change log' });
    }
  }

  private static generateCSV(logs: any[]): string {
    const headers = ['Timestamp', 'User', 'Field', 'Old Value', 'New Value', 'Type', 'Description'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.username,
      log.field_path,
      JSON.stringify(log.old_value),
      JSON.stringify(log.new_value),
      log.change_type,
      log.description || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
