import { query } from '../config/database';
import { ChangeLog, ChangeLogDTO, ChangeType } from '../types';

export class ChangeLogModel {
  static async create(
    characterId: string,
    userId: string,
    fieldPath: string,
    oldValue: any,
    newValue: any,
    changeType: ChangeType,
    description?: string,
    sessionId?: string
  ): Promise<ChangeLog> {
    const result = await query(
      `INSERT INTO change_logs
       (character_id, user_id, field_path, old_value, new_value, change_type, description, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        characterId,
        userId,
        fieldPath,
        JSON.stringify(oldValue),
        JSON.stringify(newValue),
        changeType,
        description || null,
        sessionId || null,
      ]
    );
    return result.rows[0];
  }

  static async findByCharacterId(
    characterId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ChangeLogDTO[]> {
    const result = await query(
      `SELECT cl.*, c.name as character_name, u.username
       FROM change_logs cl
       JOIN characters c ON cl.character_id = c.id
       JOIN users u ON cl.user_id = u.id
       WHERE cl.character_id = $1
       ORDER BY cl.timestamp DESC
       LIMIT $2 OFFSET $3`,
      [characterId, limit, offset]
    );
    return result.rows;
  }

  static async findByUserId(userId: string, limit: number = 100): Promise<ChangeLogDTO[]> {
    const result = await query(
      `SELECT cl.*, c.name as character_name, u.username
       FROM change_logs cl
       JOIN characters c ON cl.character_id = c.id
       JOIN users u ON cl.user_id = u.id
       WHERE cl.user_id = $1
       ORDER BY cl.timestamp DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async findAll(limit: number = 100): Promise<ChangeLogDTO[]> {
    const result = await query(
      `SELECT cl.*, c.name as character_name, u.username
       FROM change_logs cl
       JOIN characters c ON cl.character_id = c.id
       JOIN users u ON cl.user_id = u.id
       ORDER BY cl.timestamp DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async deleteByCharacterId(characterId: string): Promise<number> {
    const result = await query(
      'DELETE FROM change_logs WHERE character_id = $1',
      [characterId]
    );
    return result.rowCount || 0;
  }

  static async getCountByCharacterId(characterId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM change_logs WHERE character_id = $1',
      [characterId]
    );
    return parseInt(result.rows[0].count);
  }
}
