import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { UserModel } from '../models/user.model';
import { LoginCredentials, LoginResponse, JWTPayload } from '../types';
import { query } from '../config/database';
import crypto from 'crypto';

export class AuthService {
  static async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const { username, password } = credentials;

    // Find user
    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isValid = await UserModel.verifyPassword(user, password);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create JWT payload
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId,
    };

    // Generate token
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Store session in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, user.id, tokenHash, expiresAt, ipAddress || null, userAgent || null]
    );

    // Update last login
    await UserModel.updateLastLogin(user.id);

    return {
      user: UserModel.toDTO(user),
      token,
      expiresAt,
    };
  }

  static async logout(sessionId: string): Promise<void> {
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  }

  static async validateSession(sessionId: string): Promise<boolean> {
    const result = await query(
      'SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()',
      [sessionId]
    );
    return result.rows.length > 0;
  }

  static async cleanExpiredSessions(): Promise<number> {
    const result = await query('DELETE FROM sessions WHERE expires_at < NOW()');
    return result.rowCount || 0;
  }
}
