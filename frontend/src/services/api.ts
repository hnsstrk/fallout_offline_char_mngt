import axios, { AxiosInstance, AxiosError } from 'axios';
import { User, LoginResponse, Character, ChangeLog, ImportResult, MergeDecision } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  // Character endpoints
  async getCharacters(): Promise<Character[]> {
    const response = await this.client.get<Character[]>('/characters');
    return response.data;
  }

  async getCharacter(id: string): Promise<Character> {
    const response = await this.client.get<Character>(`/characters/${id}`);
    return response.data;
  }

  async importCharacter(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ImportResult>('/characters/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async mergeCharacter(
    characterId: string,
    importedData: any,
    mergeDecisions: MergeDecision[]
  ): Promise<ImportResult> {
    const response = await this.client.post<ImportResult>(
      `/characters/${characterId}/merge`,
      {
        importedData,
        mergeDecisions,
      }
    );
    return response.data;
  }

  async updateCharacterField(
    characterId: string,
    fieldPath: string,
    value: any
  ): Promise<Character> {
    const response = await this.client.put<Character>(`/characters/${characterId}`, {
      fieldPath,
      value,
    });
    return response.data;
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.client.delete(`/characters/${id}`);
  }

  // Change log endpoints
  async getChangeLogs(characterId: string, limit?: number, offset?: number): Promise<{
    logs: ChangeLog[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    const response = await this.client.get(`/changelogs/${characterId}`, {
      params: { limit, offset },
    });
    return response.data;
  }

  async exportChangeLog(characterId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await this.client.get(`/changelogs/${characterId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  // User management endpoints (admin only)
  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users');
    return response.data;
  }

  async createUser(username: string, password: string, role: string): Promise<User> {
    const response = await this.client.post<User>('/users', {
      username,
      password,
      role,
    });
    return response.data;
  }

  async updateUser(id: string, data: { role?: string; password?: string }): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const api = new ApiService();
