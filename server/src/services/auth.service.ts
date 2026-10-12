import { randomUUID } from 'node:crypto';
import type { AppEnv } from '../config/env.js';
import type { DatabaseClient } from '../config/database.js';
import { AppError } from '../errors/app-error.js';
import type { AuthDeliveryProvider } from '../providers/auth-delivery.provider.js';
import { createOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from '../auth/crypto.js';
import { signAccessToken } from '../auth/jwt.js';
import type { AuthRepository } from '../repositories/auth.repository.js';

export interface AuthRequestContext {
  requestId: string | undefined;
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export class AuthService {
  constructor(
    private readonly env: AppEnv,
    private readonly db: DatabaseClient,
    private readonly repo: AuthRepository,
    private readonly delivery: AuthDeliveryProvider
  ) {}

  private refreshExpiry() {
    return new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 86400000);
  }

  private publicUser(user: { id: string; email: string | null; emailVerifiedAt: Date | null; status: string; authSource: string }, roles: string[]) {
    return { id: user.id, email: user.email, emailVerified: Boolean(user.emailVerifiedAt), status: user.status, authSource: user.authSource, roles };
  }

  async register(input: { email: string; password: string }, ctx: AuthRequestContext) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.repo.findUserByEmail(email);
    if (existing) throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const userId = await this.db.withTransaction((tx) => this.repo.createNativeUser({ email, passwordHash }, tx));
    const token = createOpaqueToken();
    await this.repo.createEmailVerificationToken(userId, hashOpaqueToken(token), new Date(Date.now() + this.env.EMAIL_VERIFICATION_TTL_HOURS * 3600000), ctx.ipAddress);
    await this.delivery.sendEmailVerification({ email, token });
    await this.repo.writeAudit({ userId, eventType: 'auth.register', outcome: 'success', ...ctx });
    return { userId, emailVerificationRequired: true };
  }

  async login(input: { email: string; password: string }, ctx: AuthRequestContext) {
    const user = await this.repo.findUserByEmail(input.email.trim().toLowerCase());
    if (!user) {
      await this.repo.writeAudit({ userId: undefined, eventType: 'auth.login', outcome: 'failure', ...ctx, metadata: { reason: 'invalid_credentials' } });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (user.status === 'disabled') throw new AppError(403, 'ACCOUNT_DISABLED', 'This account is disabled');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.repo.writeAudit({ userId: user.id, eventType: 'auth.login', outcome: 'blocked', ...ctx, metadata: { reason: 'locked' } });
      throw new AppError(429, 'ACCOUNT_TEMPORARILY_LOCKED', 'Too many failed sign-in attempts. Try again later.');
    }
    if (!user.nativeLoginEnabled || !user.passwordHash) {
      throw new AppError(409, 'PASSWORD_SETUP_REQUIRED', 'Set a password using the password-reset flow before signing in here');
    }

    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) {
      await this.repo.incrementFailedLogin(user.id);
      await this.repo.writeAudit({ userId: user.id, eventType: 'auth.login', outcome: 'failure', ...ctx, metadata: { reason: 'invalid_credentials' } });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (!user.emailVerifiedAt) throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before signing in');

    const roles = await this.repo.getRoles(user.id);
    const refreshToken = createOpaqueToken();
    const tokenFamilyId = randomUUID();
    const sessionId = await this.repo.createSession({
      userId: user.id,
      refreshTokenHash: hashOpaqueToken(refreshToken),
      tokenFamilyId,
      expiresAt: this.refreshExpiry(),
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });
    const accessToken = await signAccessToken(this.env, { userId: user.id, sessionId, roles });
    await this.repo.markLoginSuccess(user.id);
    await this.repo.writeAudit({ userId: user.id, eventType: 'auth.login', outcome: 'success', ...ctx, metadata: { sessionId } });
    return { accessToken, refreshToken, expiresInSeconds: this.env.JWT_ACCESS_TTL_MINUTES * 60, user: this.publicUser(user, roles) };
  }

  async refresh(refreshToken: string, ctx: AuthRequestContext) {
    const tokenHash = hashOpaqueToken(refreshToken);
    const result = await this.db.withTransaction(async (tx) => {
      const session = await this.repo.findSessionByRefreshHash(tokenHash, tx);
      if (!session) return { kind: 'invalid' as const };
      if (session.revokedAt) {
        await this.repo.revokeFamily(session.tokenFamilyId, 'refresh_token_reuse', tx);
        return { kind: 'reused' as const, userId: session.userId };
      }
      if (session.expiresAt <= new Date()) return { kind: 'expired' as const, userId: session.userId };
      const user = await this.repo.findUserById(session.userId, tx);
      if (!user || user.status !== 'active') return { kind: 'invalid_session' as const, userId: session.userId };
      const roles = await this.repo.getRoles(user.id, tx);
      const nextRefreshToken = createOpaqueToken();
      const nextSessionId = await this.repo.rotateSession({
        oldSessionId: session.id,
        userId: user.id,
        tokenFamilyId: session.tokenFamilyId,
        refreshTokenHash: hashOpaqueToken(nextRefreshToken),
        expiresAt: this.refreshExpiry(),
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent
      }, tx);
      const accessToken = await signAccessToken(this.env, { userId: user.id, sessionId: nextSessionId, roles });
      return { kind: 'success' as const, data: { accessToken, refreshToken: nextRefreshToken, expiresInSeconds: this.env.JWT_ACCESS_TTL_MINUTES * 60 } };
    });

    if (result.kind === 'reused') {
      await this.repo.writeAudit({ userId: result.userId, eventType: 'auth.refresh_reuse', outcome: 'blocked', ...ctx });
      throw new AppError(401, 'REFRESH_TOKEN_REUSED', 'Refresh token is no longer valid');
    }
    if (result.kind === 'expired') throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
    if (result.kind !== 'success') throw new AppError(401, result.kind === 'invalid_session' ? 'SESSION_INVALID' : 'INVALID_REFRESH_TOKEN', 'Session is no longer valid');
    return result.data;
  }

  async logout(userId: string, sessionId: string, ctx: AuthRequestContext) {
    await this.repo.revokeSessionById(sessionId, 'logout');
    await this.repo.writeAudit({ userId, eventType: 'auth.logout', outcome: 'success', ...ctx, metadata: { sessionId } });
  }

  async logoutAll(userId: string, ctx: AuthRequestContext) {
    await this.repo.revokeAllUserSessions(userId, 'logout_all');
    await this.repo.writeAudit({ userId, eventType: 'auth.logout_all', outcome: 'success', ...ctx });
  }

  async me(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    const roles = await this.repo.getRoles(userId);
    return this.publicUser(user, roles);
  }

  async requestPasswordReset(emailInput: string, ctx: AuthRequestContext) {
    const user = await this.repo.findUserByEmail(emailInput.trim().toLowerCase());
    if (user && user.email) {
      const token = createOpaqueToken();
      await this.repo.createPasswordResetToken(user.id, hashOpaqueToken(token), new Date(Date.now() + this.env.PASSWORD_RESET_TTL_MINUTES * 60000), ctx.ipAddress);
      await this.delivery.sendPasswordReset({ email: user.email, token });
      await this.repo.writeAudit({ userId: user.id, eventType: 'auth.password_reset_requested', outcome: 'success', ...ctx });
    }
    return { accepted: true };
  }

  async resetPassword(token: string, newPassword: string, ctx: AuthRequestContext) {
    const passwordHash = await hashPassword(newPassword);
    const userId = await this.repo.resetPasswordByToken(hashOpaqueToken(token), passwordHash);
    if (!userId) throw new AppError(400, 'INVALID_OR_EXPIRED_RESET_TOKEN', 'Password reset token is invalid or expired');
    await this.repo.writeAudit({ userId, eventType: 'auth.password_reset_completed', outcome: 'success', ...ctx });
    return { passwordReset: true };
  }

  async resendVerification(emailInput: string, ctx: AuthRequestContext) {
    const user = await this.repo.findUserByEmail(emailInput.trim().toLowerCase());
    if (user?.email && !user.emailVerifiedAt && user.status !== 'disabled') {
      const token = createOpaqueToken();
      await this.repo.createEmailVerificationToken(user.id, hashOpaqueToken(token), new Date(Date.now() + this.env.EMAIL_VERIFICATION_TTL_HOURS * 3600000), ctx.ipAddress);
      await this.delivery.sendEmailVerification({ email: user.email, token });
    }
    return { accepted: true };
  }

  async verifyEmail(token: string, ctx: AuthRequestContext) {
    const userId = await this.repo.consumeEmailVerificationToken(hashOpaqueToken(token));
    if (!userId) throw new AppError(400, 'INVALID_OR_EXPIRED_VERIFICATION_TOKEN', 'Verification token is invalid or expired');
    await this.repo.writeAudit({ userId, eventType: 'auth.email_verified', outcome: 'success', ...ctx });
    return { emailVerified: true };
  }
}
