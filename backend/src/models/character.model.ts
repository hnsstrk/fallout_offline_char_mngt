import { query } from '../config/database';
import { Character, CharacterDTO, FVTTCharacterData } from '../types';

export class CharacterModel {
  static async findById(id: string): Promise<Character | null> {
    const result = await query(
      'SELECT * FROM characters WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByOwnerId(ownerId: string): Promise<CharacterDTO[]> {
    const result = await query(
      `SELECT c.*, u.username as owner_username
       FROM characters c
       JOIN users u ON c.owner_id = u.id
       WHERE c.owner_id = $1 AND c.is_active = true
       ORDER BY c.last_modified DESC`,
      [ownerId]
    );
    return result.rows;
  }

  static async findAll(): Promise<CharacterDTO[]> {
    const result = await query(
      `SELECT c.*, u.username as owner_username
       FROM characters c
       JOIN users u ON c.owner_id = u.id
       WHERE c.is_active = true
       ORDER BY c.last_modified DESC`
    );
    return result.rows;
  }

  static async findByFVTTId(fvttId: string, ownerId: string): Promise<Character | null> {
    const result = await query(
      'SELECT * FROM characters WHERE fvtt_id = $1 AND owner_id = $2 AND is_active = true',
      [fvttId, ownerId]
    );
    return result.rows[0] || null;
  }

  static async create(
    name: string,
    ownerId: string,
    jsonData: FVTTCharacterData,
    originalFilename?: string,
    fvttId?: string
  ): Promise<Character> {
    const result = await query(
      `INSERT INTO characters (name, owner_id, json_data, original_filename, fvtt_id, version)
       VALUES ($1, $2, $3, $4, $5, 1)
       RETURNING *`,
      [name, ownerId, JSON.stringify(jsonData), originalFilename || null, fvttId || null]
    );
    return result.rows[0];
  }

  static async update(
    id: string,
    jsonData: FVTTCharacterData,
    incrementVersion: boolean = true
  ): Promise<Character | null> {
    const versionUpdate = incrementVersion ? ', version = version + 1' : '';
    const result = await query(
      `UPDATE characters
       SET json_data = $1, last_modified = CURRENT_TIMESTAMP${versionUpdate}
       WHERE id = $2 AND is_active = true
       RETURNING *`,
      [JSON.stringify(jsonData), id]
    );
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    // Soft delete
    const result = await query(
      'UPDATE characters SET is_active = false WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async hardDelete(id: string): Promise<boolean> {
    // Hard delete (admin only)
    const result = await query(
      'DELETE FROM characters WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async updateName(id: string, name: string): Promise<boolean> {
    const result = await query(
      'UPDATE characters SET name = $1 WHERE id = $2',
      [name, id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static toDTO(character: Character, ownerUsername?: string): CharacterDTO {
    return {
      id: character.id,
      name: character.name,
      owner_id: character.owner_id,
      owner_username: ownerUsername,
      json_data: character.json_data,
      imported_at: character.imported_at,
      last_modified: character.last_modified,
      version: character.version,
    };
  }
}
