import type { QueryableDatabase, DatabaseClient } from '../config/database.js';
import type { AppRole } from '../auth/permissions.js';

export interface AuthUserRecord {
  id: string;
  email: string | null;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  status: 'active' | 'disabled' | 'pending_verification';
  authSource: 'legacy' | 'native';
  nativeLoginEnabled: boolean;
  lockedUntil: Date | null;
  failedLoginCount: number;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenFamilyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

function mapUser(row: any): AuthUserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerifiedAt: row.email_verified_at,
    status: row.status,
    authSource: row.auth_source,
    nativeLoginEnabled: row.native_login_enabled,
    lockedUntil: row.locked_until,
    failedLoginCount: row.failed_login_count
  };
}

export class AuthRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findUserByEmail(email: string, tx: QueryableDatabase = this.db) {
    const result = await tx.query('SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findUserById(id: string, tx: QueryableDatabase = this.db) {
    const result = await tx.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async getRoles(userId: string, tx: QueryableDatabase = this.db): Promise<AppRole[]> {
    const result = await tx.query<{ role: AppRole }>('SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role', [userId]);
    return result.rows.map((row) => row.role);
  }

  async getActiveSessionRoles(userId: string, sessionId: string): Promise<AppRole[] | null> {
    const result = await this.db.query<{ roles: AppRole[] }>(
      `SELECT COALESCE(array_agg(ur.role ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}')::text[] AS roles
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       WHERE s.id = $1 AND s.user_id = $2 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.status = 'active'
       GROUP BY s.id`,
      [sessionId, userId]
    );
    return result.rows[0]?.roles ?? null;
  }

  async createNativeUser(input: { email: string; passwordHash: string }, tx: QueryableDatabase) {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, auth_source, status, native_login_enabled, password_changed_at)
       VALUES ($1, $2, 'native', 'pending_verification', true, now()) RETURNING id`,
      [input.email, input.passwordHash]
    );
    const id = result.rows[0]!.id;
    await tx.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'user') ON CONFLICT DO NOTHING`, [id]);
    await tx.query(`INSERT INTO profiles (user_id, email) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`, [id, input.email]);
    return id;
  }

  async incrementFailedLogin(userId: string) {
    await this.db.query(
      `UPDATE users SET failed_login_count = failed_login_count + 1,
       locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
       WHERE id = $1`,
      [userId]
    );
  }

  async markLoginSuccess(userId: string) {
    await this.db.query(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = now() WHERE id = $1`,
      [userId]
    );
  }

  async createSession(input: {
    userId: string;
    refreshTokenHash: string;
    tokenFamilyId: string;
    expiresAt: Date;
    ipAddress: string | undefined;
    userAgent: string | undefined;
  }, tx: QueryableDatabase = this.db) {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO auth_sessions (user_id, refresh_token_hash, token_family_id, expires_at, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [input.userId, input.refreshTokenHash, input.tokenFamilyId, input.expiresAt, input.ipAddress ?? null, input.userAgent ?? null]
    );
    return result.rows[0]!.id;
  }

  async findSessionByRefreshHash(refreshTokenHash: string, tx: QueryableDatabase = this.db) {
    const result = await tx.query(
      `SELECT id, user_id, token_family_id, expires_at, revoked_at
       FROM auth_sessions WHERE refresh_token_hash = $1 LIMIT 1 FOR UPDATE`,
      [refreshTokenHash]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      tokenFamilyId: row.token_family_id,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at
    } as SessionRecord;
  }

  async rotateSession(input: {
    oldSessionId: string;
    userId: string;
    tokenFamilyId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipAddress: string | undefined;
    userAgent: string | undefined;
  }, tx: QueryableDatabase) {
    const newId = await this.createSession({
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      tokenFamilyId: input.tokenFamilyId,
      expiresAt: input.expiresAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }, tx);
    await tx.query(
      `UPDATE auth_sessions SET revoked_at = now(), rotated_at = now(), revoke_reason = 'rotated', replaced_by_session_id = $2
       WHERE id = $1 AND revoked_at IS NULL`,
      [input.oldSessionId, newId]
    );
    return newId;
  }

  async revokeSessionById(sessionId: string, reason: string) {
    await this.db.query(`UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, now()), revoke_reason = COALESCE(revoke_reason, $2) WHERE id = $1`, [sessionId, reason]);
  }

  async revokeFamily(tokenFamilyId: string, reason: string, tx: QueryableDatabase = this.db) {
    await tx.query(`UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, now()), revoke_reason = COALESCE(revoke_reason, $2) WHERE token_family_id = $1`, [tokenFamilyId, reason]);
  }

  async revokeAllUserSessions(userId: string, reason: string, tx: QueryableDatabase = this.db) {
    await tx.query(`UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, now()), revoke_reason = COALESCE(revoke_reason, $2) WHERE user_id = $1`, [userId, reason]);
  }

  async createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date, requestedIp?: string) {
    await this.db.withTransaction(async (tx) => {
      await tx.query(`UPDATE email_verification_tokens SET consumed_at = now() WHERE user_id = $1 AND consumed_at IS NULL`, [userId]);
      await tx.query(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, requested_ip) VALUES ($1,$2,$3,$4)`,
        [userId, tokenHash, expiresAt, requestedIp ?? null]
      );
    });
  }

  async consumeEmailVerificationToken(tokenHash: string) {
    return this.db.withTransaction(async (tx) => {
      const found = await tx.query<{ id: string; user_id: string; expires_at: Date; consumed_at: Date | null }>(
        `SELECT id,user_id,expires_at,consumed_at FROM email_verification_tokens WHERE token_hash=$1 FOR UPDATE`, [tokenHash]
      );
      const row = found.rows[0];
      if (!row || row.consumed_at || row.expires_at <= new Date()) return null;
      await tx.query(`UPDATE email_verification_tokens SET consumed_at=now() WHERE id=$1`, [row.id]);
      await tx.query(`UPDATE users SET email_verified_at=COALESCE(email_verified_at,now()), status=CASE WHEN status='disabled' THEN 'disabled' ELSE 'active' END WHERE id=$1`, [row.user_id]);
      return row.user_id;
    });
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date, requestedIp?: string) {
    await this.db.withTransaction(async (tx) => {
      await tx.query(`UPDATE password_reset_tokens SET consumed_at = now() WHERE user_id = $1 AND consumed_at IS NULL`, [userId]);
      await tx.query(`INSERT INTO password_reset_tokens (user_id,token_hash,expires_at,requested_ip) VALUES ($1,$2,$3,$4)`, [userId, tokenHash, expiresAt, requestedIp ?? null]);
    });
  }

  async resetPasswordByToken(tokenHash: string, passwordHash: string) {
    return this.db.withTransaction(async (tx) => {
      const found = await tx.query<{ id: string; user_id: string; expires_at: Date; consumed_at: Date | null }>(
        `SELECT id,user_id,expires_at,consumed_at FROM password_reset_tokens WHERE token_hash=$1 FOR UPDATE`, [tokenHash]
      );
      const row = found.rows[0];
      if (!row || row.consumed_at || row.expires_at <= new Date()) return null;
      await tx.query(`UPDATE password_reset_tokens SET consumed_at=now() WHERE id=$1`, [row.id]);
      await tx.query(
        `UPDATE users SET password_hash=$2,native_login_enabled=true,password_changed_at=now(),failed_login_count=0,locked_until=NULL WHERE id=$1`,
        [row.user_id, passwordHash]
      );
      await this.revokeAllUserSessions(row.user_id, 'password_reset', tx);
      return row.user_id;
    });
  }

  async writeAudit(input: {
    userId: string | undefined;
    eventType: string;
    outcome: 'success' | 'failure' | 'blocked';
    requestId: string | undefined;
    ipAddress: string | undefined;
    userAgent: string | undefined;
    metadata?: Record<string, unknown>;
  }) {
    await this.db.query(
      `INSERT INTO security_audit_events (user_id,event_type,outcome,request_id,ip_address,user_agent,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [input.userId ?? null, input.eventType, input.outcome, input.requestId ?? null, input.ipAddress ?? null, input.userAgent ?? null, JSON.stringify(input.metadata ?? {})]
    );
  }
}
