import { create } from 'zustand';
import { User, Character } from '../types';
import { api } from './api';
import { wsService } from './websocket';

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;

  // Character state
  characters: Character[];
  currentCharacter: Character | null;
  isLoadingCharacters: boolean;

  // UI state
  isMobileMenuOpen: boolean;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  loadCharacters: () => Promise<void>;
  loadCharacter: (id: string) => Promise<void>;
  updateCharacterField: (characterId: string, fieldPath: string, value: any) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
  toggleMobileMenu: () => void;
  handleWebSocketMessage: (message: any) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('auth_token'),
  characters: [],
  currentCharacter: null,
  isLoadingCharacters: false,
  isMobileMenuOpen: false,

  // Auth actions
  login: async (username, password) => {
    try {
      const response = await api.login(username, password);
      localStorage.setItem('auth_token', response.token);

      set({
        user: response.user,
        isAuthenticated: true,
        token: response.token,
      });

      // Connect WebSocket
      wsService.connect(response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      wsService.disconnect();

      set({
        user: null,
        isAuthenticated: false,
        token: null,
        characters: [],
        currentCharacter: null,
      });
    }
  },

  loadCurrentUser: async () => {
    try {
      const user = await api.getCurrentUser();
      set({ user, isAuthenticated: true });

      // Connect WebSocket if we have a token
      const token = get().token;
      if (token) {
        wsService.connect(token);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
      set({ user: null, isAuthenticated: false, token: null });
      localStorage.removeItem('auth_token');
    }
  },

  // Character actions
  loadCharacters: async () => {
    set({ isLoadingCharacters: true });
    try {
      const characters = await api.getCharacters();
      set({ characters, isLoadingCharacters: false });
    } catch (error) {
      console.error('Failed to load characters:', error);
      set({ isLoadingCharacters: false });
    }
  },

  loadCharacter: async (id) => {
    try {
      const character = await api.getCharacter(id);
      set({ currentCharacter: character });

      // Join WebSocket room for this character
      wsService.joinCharacter(id);
    } catch (error) {
      console.error('Failed to load character:', error);
    }
  },

  updateCharacterField: async (characterId, fieldPath, value) => {
    try {
      const updated = await api.updateCharacterField(characterId, fieldPath, value);

      // Update in store
      set((state) => ({
        characters: state.characters.map((c) =>
          c.id === characterId ? updated : c
        ),
        currentCharacter:
          state.currentCharacter?.id === characterId ? updated : state.currentCharacter,
      }));
    } catch (error) {
      console.error('Failed to update character:', error);
      throw error;
    }
  },

  deleteCharacter: async (id) => {
    try {
      await api.deleteCharacter(id);

      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
        currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter,
      }));
    } catch (error) {
      console.error('Failed to delete character:', error);
      throw error;
    }
  },

  setCurrentCharacter: (character) => {
    set({ currentCharacter: character });
  },

  // UI actions
  toggleMobileMenu: () => {
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
  },

  // WebSocket handler
  handleWebSocketMessage: (message) => {
    const { type, payload } = message;

    switch (type) {
      case 'character_update': {
        const { characterId, data } = payload;
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === characterId ? { ...c, json_data: data } : c
          ),
          currentCharacter:
            state.currentCharacter?.id === characterId
              ? { ...state.currentCharacter, json_data: data }
              : state.currentCharacter,
        }));
        break;
      }

      case 'character_delete': {
        const { characterId } = payload;
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== characterId),
          currentCharacter:
            state.currentCharacter?.id === characterId ? null : state.currentCharacter,
        }));
        break;
      }

      case 'user_online':
      case 'user_offline':
        // Can be used to show online status in the future
        console.log(`User ${payload.username} is ${type === 'user_online' ? 'online' : 'offline'}`);
        break;
    }
  },
}));

// Initialize WebSocket message handler
wsService.addHandler(useStore.getState().handleWebSocketMessage);
