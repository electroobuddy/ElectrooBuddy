import { SignJWT, jwtVerify } from 'jose';
import type { AppEnv } from '../config/env.js';
import type { AppRole } from './permissions.js';

export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
  roles: AppRole[];
}

function secret(env: AppEnv) {
  return new TextEncoder().encode(env.JWT_ACCESS_SECRET);
}

export async function signAccessToken(env: AppEnv, claims: AccessTokenClaims) {
  return new SignJWT({ roles: claims.roles, sid: claims.sessionId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.userId)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_MINUTES}m`)
    .sign(secret(env));
}

export async function verifyAccessToken(env: AppEnv, token: string): Promise<AccessTokenClaims> {
  const result = await jwtVerify(token, secret(env), {
    algorithms: ['HS256'],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
  if (!result.payload.sub || typeof result.payload.sid !== 'string' || !Array.isArray(result.payload.roles)) {
    throw new Error('Invalid access-token claims');
  }
  return {
    userId: result.payload.sub,
    sessionId: result.payload.sid,
    roles: result.payload.roles as AppRole[]
  };
}
