import { CharacterModel } from '../models/character.model';
import { ChangeLogModel } from '../models/changelog.model';
import { Character, CharacterDTO, FVTTCharacterData, ImportDiff, ImportResult, MergeDecision } from '../types';
import { DiffService } from './diff.service';
import { query } from '../config/database';

export class CharacterService {
  /**
   * Import a new character or trigger merge for existing
   */
  static async importCharacter(
    userId: string,
    jsonData: FVTTCharacterData,
    filename?: string
  ): Promise<{ character: Character; needsMerge: boolean; diffs?: ImportDiff[] }> {
    // Extract FVTT ID if available
    const fvttId = this.extractFVTTId(jsonData);
    const characterName = jsonData.name;

    // Check if character already exists
    if (fvttId) {
      const existing = await CharacterModel.findByFVTTId(fvttId, userId);

      if (existing) {
        // Character exists, generate diff for merge
        const diffs = DiffService.compareCharacters(existing.json_data, jsonData);

        return {
          character: existing,
          needsMerge: diffs.length > 0,
          diffs: diffs,
        };
      }
    }

    // Create new character
    const character = await CharacterModel.create(
      characterName,
      userId,
      jsonData,
      filename,
      fvttId
    );

    // Log creation
    await ChangeLogModel.create(
      character.id,
      userId,
      'character',
      null,
      { name: characterName },
      'create',
      'Character imported from FVTT'
    );

    return {
      character,
      needsMerge: false,
    };
  }

  /**
   * Merge imported character with existing
   */
  static async mergeCharacter(
    characterId: string,
    userId: string,
    importedData: FVTTCharacterData,
    mergeDecisions: MergeDecision[]
  ): Promise<ImportResult> {
    const character = await CharacterModel.findById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Generate full diff
    const diffs = DiffService.compareCharacters(character.json_data, importedData);

    // Convert decisions to map
    const decisionsMap = new Map<string, 'keep_local' | 'use_imported'>();
    for (const decision of mergeDecisions) {
      decisionsMap.set(decision.field, decision.action);
    }

    // Auto-resolve remaining conflicts
    const autoDecisions = DiffService.autoResolve(diffs);
    for (const [field, action] of autoDecisions.entries()) {
      if (!decisionsMap.has(field)) {
        decisionsMap.set(field, action);
      }
    }

    // Apply merge
    const mergedData = DiffService.applyMerge(character.json_data, importedData, decisionsMap);

    // Update character
    await CharacterModel.update(characterId, mergedData, true);

    // Clear old change logs (as per requirements)
    const deletedLogs = await ChangeLogModel.deleteByCharacterId(characterId);

    // Log the merge
    await ChangeLogModel.create(
      characterId,
      userId,
      'character',
      character.json_data,
      mergedData,
      'merge',
      `Merged ${diffs.length} changes (${deletedLogs} previous logs cleared)`
    );

    // Record import history
    await query(
      `INSERT INTO import_history
       (character_id, imported_by, original_filename, changes_detected, changes_applied, merge_strategy, diff_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        characterId,
        userId,
        character.original_filename,
        diffs.length,
        mergeDecisions.length,
        'user_guided',
        JSON.stringify(diffs.slice(0, 50)), // Store first 50 diffs
      ]
    );

    return {
      character_id: characterId,
      changes_detected: diffs.length,
      changes_applied: mergeDecisions.length,
      diff_summary: diffs,
      merge_strategy: 'user_guided',
    };
  }

  /**
   * Update character field
   */
  static async updateField(
    characterId: string,
    userId: string,
    fieldPath: string,
    newValue: any
  ): Promise<Character> {
    const character = await CharacterModel.findById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Get old value
    const oldValue = this.getNestedValue(character.json_data, fieldPath);

    // Update value
    const updatedData = JSON.parse(JSON.stringify(character.json_data));
    this.setNestedValue(updatedData, fieldPath, newValue);

    // Save
    const updated = await CharacterModel.update(characterId, updatedData, false);
    if (!updated) {
      throw new Error('Failed to update character');
    }

    // Log change
    await ChangeLogModel.create(
      characterId,
      userId,
      fieldPath,
      oldValue,
      newValue,
      'update',
      `Updated ${fieldPath}`
    );

    return updated;
  }

  /**
   * Get characters for user (filtered by role)
   */
  static async getCharactersForUser(
    userId: string,
    userRole: string
  ): Promise<CharacterDTO[]> {
    if (userRole === 'admin' || userRole === 'gm') {
      return CharacterModel.findAll();
    } else {
      return CharacterModel.findByOwnerId(userId);
    }
  }

  /**
   * Check if user can access character
   */
  static async canUserAccessCharacter(
    userId: string,
    userRole: string,
    characterId: string
  ): Promise<boolean> {
    if (userRole === 'admin' || userRole === 'gm') {
      return true;
    }

    const character = await CharacterModel.findById(characterId);
    return character !== null && character.owner_id === userId;
  }

  private static extractFVTTId(jsonData: FVTTCharacterData): string | null {
    // Try multiple places where FVTT might store the ID
    return (
      jsonData._id ||
      jsonData.flags?.core?.sourceId ||
      jsonData._stats?.exportSource?.uuid ||
      null
    );
  }

  private static getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}
