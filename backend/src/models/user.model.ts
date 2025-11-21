import { query } from '../config/database';
import { User, UserDTO, UserRole } from '../types';
import bcrypt from 'bcrypt';
import { config } from '../config';

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  static async findAll(): Promise<UserDTO[]> {
    const result = await query(
      'SELECT id, username, role, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async create(username: string, password: string, role: UserRole): Promise<UserDTO> {
    const password_hash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    const result = await query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role, created_at, last_login`,
      [username, password_hash, role]
    );

    return result.rows[0];
  }

  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const password_hash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  static async updateRole(id: string, role: UserRole): Promise<boolean> {
    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [role, id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  static async updateLastLogin(id: string): Promise<void> {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login,
    };
  }
}
