import { Request } from 'express';

// User types
export type UserRole = 'player' | 'gm' | 'admin';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface UserDTO {
  id: string;
  username: string;
  role: UserRole;
  created_at: Date;
  last_login: Date | null;
}

// Character types
export interface Character {
  id: string;
  name: string;
  original_filename: string | null;
  fvtt_id: string | null;
  owner_id: string;
  json_data: FVTTCharacterData;
  imported_at: Date;
  last_modified: Date;
  version: number;
  is_active: boolean;
}

export interface CharacterDTO {
  id: string;
  name: string;
  owner_id: string;
  owner_username?: string;
  json_data: FVTTCharacterData;
  imported_at: Date;
  last_modified: Date;
  version: number;
}

// FVTT Character data structure
export interface FVTTCharacterData {
  name: string;
  type: string;
  img?: string;
  system: {
    biography?: string;
    complication?: number;
    description?: string;
    level: {
      currentXP: number;
      nextLevelXP: number;
      rewardXP: number;
      value: number;
    };
    origin?: string;
    trait?: string;
    body_parts: {
      [key: string]: BodyPart;
    };
    bodyType?: string;
    immunities?: {
      poison: boolean;
      radiation: boolean;
    };
    conditions: {
      alcoholic?: boolean;
      fatigue: number;
      hunger: number;
      lastChanged?: {
        hunger: number;
        sleep: number;
        thirst: number;
      };
      intoxication: number;
      sleep: number;
      thirst: number;
      wellRested?: boolean;
    };
    defense: {
      bonus: number;
      value: number;
    };
    health: {
      bonus: number;
      max: number;
      value: number;
    };
    initiative: {
      bonus: number;
      value: number;
    };
    luckPoints: number;
    meleeDamage: {
      bonus: number;
      value: number;
    };
    radiation: number;
    resistance: {
      energy: number;
      physical: number;
      poison: number;
      radiation: number;
    };
    carryWeight: {
      base: number;
      encumbranceLevel: number;
      mod: number;
      total: number;
      value: number;
    };
    readMagazines?: any[];
    attributes: {
      [key: string]: { value: number };
    };
    skill?: {
      tags: {
        additionalTags: any[];
        bonus: number;
        max: number;
      };
    };
    currency: {
      caps: number;
      other?: string;
    };
    materials: {
      junk: number;
      common: number;
      rare: number;
      uncommon: number;
    };
    chemDoses?: any;
  };
  items?: any[];
  prototypeToken?: any;
  effects?: any[];
  flags?: any;
  [key: string]: any;
}

export interface BodyPart {
  injuries: number[];
  injuryOpenCount: number;
  injuryTreatedCount: number;
  resistance: {
    energy: number;
    physical: number;
    poison: number;
    radiation: number;
  };
  status: string;
}

// Change log types
export type ChangeType = 'create' | 'update' | 'delete' | 'merge';

export interface ChangeLog {
  id: string;
  character_id: string;
  user_id: string;
  timestamp: Date;
  field_path: string;
  old_value: any;
  new_value: any;
  change_type: ChangeType;
  description: string | null;
  session_id: string | null;
}

export interface ChangeLogDTO {
  id: string;
  character_id: string;
  character_name?: string;
  user_id: string;
  username?: string;
  timestamp: Date;
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
  character_id: string;
  changes_detected: number;
  changes_applied: number;
  diff_summary: ImportDiff[];
  merge_strategy: string;
}

// Session types
export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  ip_address: string | null;
  user_agent: string | null;
}

// Auth types
export interface AuthRequest extends Request {
  user?: UserDTO;
  sessionId?: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  sessionId: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
  token: string;
  expiresAt: Date;
}

// WebSocket types
export interface WSMessage {
  type: 'character_update' | 'character_delete' | 'user_online' | 'user_offline' | 'error';
  payload: any;
  timestamp: Date;
}

export interface WSClient {
  userId: string;
  username: string;
  role: UserRole;
  socketId: string;
  connectedAt: Date;
}

// Permission types
export type PermissionLevel = 'view' | 'edit' | 'admin';

export interface CharacterPermission {
  id: string;
  character_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  granted_by: string | null;
  granted_at: Date;
}
