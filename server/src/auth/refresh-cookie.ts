import type { Request, Response } from 'express';
import type { AppEnv } from '../config/env.js';

function parseCookies(header?: string) {
  const out: Record<string,string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    out[decodeURIComponent(part.slice(0,i).trim())] = decodeURIComponent(part.slice(i+1).trim());
  }
  return out;
}

export function readRefreshCookie(req: Request, env: AppEnv) {
  return parseCookies(req.headers.cookie)[env.AUTH_REFRESH_COOKIE_NAME] || undefined;
}

export function setRefreshCookie(res: Response, env: AppEnv, token: string) {
  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || env.AUTH_REFRESH_COOKIE_SAME_SITE === 'none',
    sameSite: env.AUTH_REFRESH_COOKIE_SAME_SITE,
    domain: env.AUTH_REFRESH_COOKIE_DOMAIN || undefined,
    path: `${env.API_PREFIX}/auth`,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400000
  });
}

export function clearRefreshCookie(res: Response, env: AppEnv) {
  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || env.AUTH_REFRESH_COOKIE_SAME_SITE === 'none',
    sameSite: env.AUTH_REFRESH_COOKIE_SAME_SITE,
    domain: env.AUTH_REFRESH_COOKIE_DOMAIN || undefined,
    path: `${env.API_PREFIX}/auth`
  });
}
