// User types
export type UserRole = 'player' | 'gm' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
  last_login: string | null;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// Character types
export interface Character {
  id: string;
  name: string;
  owner_id: string;
  owner_username?: string;
  json_data: FVTTCharacterData;
  imported_at: string;
  last_modified: string;
  version: number;
}

export interface FVTTCharacterData {
  name: string;
  type: string;
  img?: string;
  system: CharacterSystem;
  items?: any[];
  [key: string]: any;
}

export interface CharacterSystem {
  biography?: string;
  level: {
    value: number;
    currentXP: number;
    nextLevelXP: number;
    rewardXP: number;
  };
  origin?: string;
  attributes: {
    [key: string]: { value: number };
  };
  health: {
    value: number;
    max: number;
    bonus: number;
  };
  conditions: {
    hunger: number;
    thirst: number;
    sleep: number;
    fatigue: number;
    intoxication: number;
    wellRested?: boolean;
  };
  defense: {
    value: number;
    bonus: number;
  };
  initiative: {
    value: number;
    bonus: number;
  };
  luckPoints: number;
  radiation: number;
  resistance: {
    physical: number;
    energy: number;
    poison: number;
    radiation: number;
  };
  body_parts: {
    [key: string]: BodyPart;
  };
  currency: {
    caps: number;
    other?: string;
  };
  materials: {
    junk: number;
    common: number;
    uncommon: number;
    rare: number;
  };
  carryWeight: {
    value: number;
    total: number;
  };
  [key: string]: any;
}

export interface BodyPart {
  status: string;
  injuries: number[];
  injuryOpenCount: number;
  injuryTreatedCount: number;
  resistance: {
    physical: number;
    energy: number;
    poison: number;
    radiation: number;
  };
}

// Change log types
export type ChangeType = 'create' | 'update' | 'delete' | 'merge';

export interface ChangeLog {
  id: string;
  character_id: string;
  character_name?: string;
  user_id: string;
  username?: string;
  timestamp: string;
  field_path: string;
  old_value: any;
  new_value: any;
  change_type: ChangeType;
  description: string | null;
}

// Import/Merge types
export interface ImportDiff {
  field: string;
  oldValue: any;
  newValue: any;
  action: 'keep_local' | 'use_imported' | 'conflict';
}

export interface MergeDecision {
  field: string;
  action: 'keep_local' | 'use_imported';
}

export interface ImportResult {
  message: string;
  needsMerge: boolean;
  characterId?: string;
  character?: Character;
  diffs?: ImportDiff[];
}

// WebSocket types
export interface WSMessage {
  type: 'character_update' | 'character_delete' | 'user_online' | 'user_offline';
  payload: any;
  timestamp: string;
}
