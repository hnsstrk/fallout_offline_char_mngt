import { FVTTCharacterData, ImportDiff } from '../types';
import * as diff from 'diff';

export class DiffService {
  /**
   * Compare two character objects and generate a detailed diff
   */
  static compareCharacters(
    local: FVTTCharacterData,
    imported: FVTTCharacterData
  ): ImportDiff[] {
    const diffs: ImportDiff[] = [];

    // Compare primitive values recursively
    this.compareObjects('', local, imported, diffs);

    return diffs;
  }

  private static compareObjects(
    path: string,
    local: any,
    imported: any,
    diffs: ImportDiff[]
  ): void {
    // Handle null/undefined
    if (local === null || local === undefined) {
      if (imported !== null && imported !== undefined) {
        diffs.push({
          field: path,
          oldValue: local,
          newValue: imported,
          action: 'use_imported',
        });
      }
      return;
    }

    if (imported === null || imported === undefined) {
      if (local !== null && local !== undefined) {
        diffs.push({
          field: path,
          oldValue: local,
          newValue: imported,
          action: 'keep_local',
        });
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(local) && Array.isArray(imported)) {
      if (JSON.stringify(local) !== JSON.stringify(imported)) {
        diffs.push({
          field: path,
          oldValue: local,
          newValue: imported,
          action: 'conflict',
        });
      }
      return;
    }

    // Handle objects
    if (typeof local === 'object' && typeof imported === 'object') {
      const allKeys = new Set([...Object.keys(local), ...Object.keys(imported)]);

      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        const localValue = local[key];
        const importedValue = imported[key];

        // Skip certain fields that should always use imported value
        const alwaysImportFields = ['_stats', 'flags', 'effects', 'prototypeToken'];
        if (alwaysImportFields.includes(key)) {
          if (JSON.stringify(localValue) !== JSON.stringify(importedValue)) {
            diffs.push({
              field: newPath,
              oldValue: localValue,
              newValue: importedValue,
              action: 'use_imported',
            });
          }
          continue;
        }

        // Recursively compare nested objects
        if (typeof localValue === 'object' && typeof importedValue === 'object') {
          this.compareObjects(newPath, localValue, importedValue, diffs);
        } else if (localValue !== importedValue) {
          // Determine action based on field type
          let action: 'keep_local' | 'use_imported' | 'conflict' = 'conflict';

          // Fields that should keep local changes (edited by users)
          const userEditableFields = [
            'system.attributes',
            'system.health.value',
            'system.conditions',
            'system.currency',
            'system.luckPoints',
            'system.radiation',
            'system.body_parts',
          ];

          // Fields that should always use imported (system/metadata)
          const systemFields = ['img', 'name', 'type'];

          if (userEditableFields.some(field => newPath.startsWith(field))) {
            action = 'keep_local';
          } else if (systemFields.some(field => newPath.startsWith(field))) {
            action = 'use_imported';
          }

          diffs.push({
            field: newPath,
            oldValue: localValue,
            newValue: importedValue,
            action,
          });
        }
      }
      return;
    }

    // Handle primitive values
    if (local !== imported) {
      diffs.push({
        field: path,
        oldValue: local,
        newValue: imported,
        action: 'conflict',
      });
    }
  }

  /**
   * Apply merge decisions to create a merged character
   */
  static applyMerge(
    local: FVTTCharacterData,
    imported: FVTTCharacterData,
    decisions: Map<string, 'keep_local' | 'use_imported'>
  ): FVTTCharacterData {
    const merged = JSON.parse(JSON.stringify(local)); // Deep clone

    for (const [fieldPath, decision] of decisions.entries()) {
      if (decision === 'use_imported') {
        this.setNestedValue(merged, fieldPath, this.getNestedValue(imported, fieldPath));
      }
      // If 'keep_local', we don't need to do anything
    }

    return merged;
  }

  /**
   * Auto-resolve conflicts based on rules
   */
  static autoResolve(diffs: ImportDiff[]): Map<string, 'keep_local' | 'use_imported'> {
    const decisions = new Map<string, 'keep_local' | 'use_imported'>();

    for (const diff of diffs) {
      if (diff.action !== 'conflict') {
        decisions.set(diff.field, diff.action);
      } else {
        // Default: prefer imported for system fields, local for user-editable fields
        const userEditablePatterns = [
          /^system\.health\.value$/,
          /^system\.conditions\./,
          /^system\.currency\./,
          /^system\.luckPoints$/,
          /^system\.radiation$/,
          /^system\.body_parts\./,
        ];

        const isUserEditable = userEditablePatterns.some(pattern => pattern.test(diff.field));
        decisions.set(diff.field, isUserEditable ? 'keep_local' : 'use_imported');
      }
    }

    return decisions;
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

  /**
   * Generate a human-readable summary of changes
   */
  static generateSummary(diffs: ImportDiff[]): string {
    const summary = {
      total: diffs.length,
      conflicts: diffs.filter(d => d.action === 'conflict').length,
      autoResolved: diffs.filter(d => d.action !== 'conflict').length,
    };

    return `${summary.total} changes detected (${summary.conflicts} conflicts, ${summary.autoResolved} auto-resolved)`;
  }
}
