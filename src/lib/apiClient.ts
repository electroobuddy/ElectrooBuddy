import type { AppUser, AuthAcceptedResult, AuthRegisterResult, EmailVerificationResult, LogoutAllResult, LogoutResult, NativeAuthSession, PasswordResetResult } from './apiContracts';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const ACCESS_KEY = 'electroobuddy_api_access_token';
const DEFAULT_TIMEOUT_MS = 30_000;
const AUTH_TIMEOUT_MS = 15_000;

let accessToken: string | null = sessionStorage.getItem(ACCESS_KEY);
let refreshPromise: Promise<boolean> | null = null;

export type NativeApiRequestInit = RequestInit & {
  /** Per-request timeout. Set to 0 to disable the client timeout. */
  timeoutMs?: number;
};

export class NativeApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly retriable: boolean;

  constructor(input: {
    message: string;
    code: string;
    status?: number;
    details?: unknown;
    requestId?: string;
    retriable?: boolean;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = 'NativeApiError';
    this.code = input.code;
    this.status = input.status ?? 0;
    this.details = input.details;
    this.requestId = input.requestId;
    this.retriable = input.retriable ?? false;
    if (input.cause !== undefined) (this as Error & { cause?: unknown }).cause = input.cause;
  }
}

export function isNativeApiError(error: unknown): error is NativeApiError {
  return error instanceof NativeApiError;
}

export function nativeApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof NativeApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getNativeAccessToken() { return accessToken; }
export function setNativeAccessToken(token: string | null) {
  accessToken = token;
  if (token) sessionStorage.setItem(ACCESS_KEY, token); else sessionStorage.removeItem(ACCESS_KEY);
}
export function nativeApiBase() {
  return API_BASE;
}

type JsonEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

function isRetriableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function fetchWithTimeout(url: string, init: NativeApiRequestInit, defaultTimeoutMs: number): Promise<Response> {
  const { timeoutMs = defaultTimeoutMs, signal: externalSignal, ...requestInit } = init;
  const controller = new AbortController();
  let timedOut = false;

  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) abortFromExternal();
    else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  }

  const timer = timeoutMs > 0
    ? window.setTimeout(() => {
        timedOut = true;
        controller.abort(new DOMException('Request timed out', 'TimeoutError'));
      }, timeoutMs)
    : null;

  try {
    return await fetch(url, { ...requestInit, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new NativeApiError({
        message: 'Request timed out. Please check your connection and try again.',
        code: 'REQUEST_TIMEOUT',
        retriable: true,
        cause: error,
      });
    }
    if (externalSignal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new NativeApiError({
        message: 'Request was cancelled.',
        code: 'REQUEST_ABORTED',
        cause: error,
      });
    }
    throw new NativeApiError({
      message: 'Unable to reach the server. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
      retriable: true,
      cause: error,
    });
  } finally {
    if (timer !== null) window.clearTimeout(timer);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}

async function parseEnvelope<T>(response: Response): Promise<JsonEnvelope<T> | null> {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204) return { success: response.ok, data: undefined as T };
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json() as JsonEnvelope<T>;
  } catch {
    return null;
  }
}

function toApiError(response: Response, payload: JsonEnvelope<unknown> | null): NativeApiError {
  const requestId = response.headers.get('x-request-id') || undefined;
  const status = response.status;
  const message = payload?.error?.message || (
    status === 401 ? 'Your session has expired. Please sign in again.' :
    status === 403 ? 'You do not have permission to perform this action.' :
    status === 404 ? 'The requested resource was not found.' :
    status === 429 ? 'Too many requests. Please try again shortly.' :
    status >= 500 ? 'The server could not complete the request. Please try again.' :
    `API request failed (${status})`
  );

  return new NativeApiError({
    message,
    code: payload?.error?.code || `HTTP_${status}`,
    status,
    details: payload?.error?.details,
    requestId,
    retriable: isRetriableStatus(status),
  });
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetchWithTimeout(`${nativeApiBase()}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
          timeoutMs: AUTH_TIMEOUT_MS,
        }, AUTH_TIMEOUT_MS);
        const payload = await parseEnvelope<{ accessToken?: string }>(response);
        if (!response.ok || !payload?.success || !payload.data?.accessToken) {
          setNativeAccessToken(null);
          return false;
        }
        setNativeAccessToken(payload.data.accessToken);
        return true;
      } catch {
        setNativeAccessToken(null);
        return false;
      }
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function nativeApiFetch<T = unknown>(path: string, init: NativeApiRequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetchWithTimeout(`${nativeApiBase()}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  }, DEFAULT_TIMEOUT_MS);

  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshAccessToken()) return nativeApiFetch<T>(path, init, false);
  }

  const payload = await parseEnvelope<T>(response);
  if (!response.ok || !payload?.success) throw toApiError(response, payload);
  return payload.data as T;
}

export async function nativeLogin(email: string, password: string) {
  const data = await nativeApiFetch<NativeAuthSession>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
  setNativeAccessToken(data.accessToken);
  return data;
}
export async function nativeRegister(email: string, password: string) {
  return nativeApiFetch<AuthRegisterResult>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
}
export async function nativeRequestPasswordReset(email: string) {
  return nativeApiFetch<AuthAcceptedResult>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }, false);
}
export async function nativeConfirmPasswordReset(token: string, newPassword: string) {
  const result = await nativeApiFetch<PasswordResetResult>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, newPassword }) }, false);
  setNativeAccessToken(null);
  return result;
}
export async function nativeResendEmailVerification(email: string) {
  return nativeApiFetch<AuthAcceptedResult>('/auth/email-verification/resend', { method: 'POST', body: JSON.stringify({ email }) }, false);
}
export async function nativeVerifyEmail(token: string) {
  return nativeApiFetch<EmailVerificationResult>('/auth/email-verification/verify', { method: 'POST', body: JSON.stringify({ token }) }, false);
}

export async function nativeRestoreSession() {
  if (!accessToken) await refreshAccessToken();
  if (!accessToken) return null;
  try { return await nativeApiFetch<AppUser>('/auth/me', {}, true); } catch { setNativeAccessToken(null); return null; }
}
export async function nativeLogout() {
  try {
    if (!accessToken) await refreshAccessToken();
    if (accessToken) {
      try { await nativeApiFetch<LogoutResult>('/auth/logout', { method: 'POST' }, false); }
      catch { if (await refreshAccessToken()) await nativeApiFetch<LogoutResult>('/auth/logout', { method: 'POST' }, false); }
    }
  } finally { setNativeAccessToken(null); }
}

export async function nativeLogoutAll() {
  try {
    if (!accessToken) await refreshAccessToken();
    if (accessToken) await nativeApiFetch<LogoutAllResult>('/auth/logout-all', { method: 'POST' }, false);
  } finally {
    setNativeAccessToken(null);
  }
}
