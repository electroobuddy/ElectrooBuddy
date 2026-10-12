import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNativeAccessToken,
  nativeApiFetch,
  nativeLogin,
  nativeLogout,
  setNativeAccessToken,
} from '../../apiClient';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('auth/session HTTP integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setNativeAccessToken(null);
    vi.restoreAllMocks();
  });

  it('stores login access token and sends it on authenticated requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: { accessToken: 'access-1', user: { id: 'u1', email: 'u@example.com', roles: ['user'], permissions: [] } },
      }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'order-1' } }));

    await nativeLogin('u@example.com', 'Password123!');
    await nativeApiFetch('/orders/order-1');

    expect(getNativeAccessToken()).toBe('access-1');
    const secondInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(new Headers(secondInit.headers).get('Authorization')).toBe('Bearer access-1');
  });

  it('refreshes once after 401 and retries the original request with the new token', async () => {
    setNativeAccessToken('expired-token');
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ success: false, error: { code: 'UNAUTHORIZED', message: 'expired' } }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { accessToken: 'fresh-token' } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [{ id: 'order-2' }] }));

    const orders = await nativeApiFetch<Array<{ id: string }>>('/orders');

    expect(orders).toEqual([{ id: 'order-2' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    const retryInit = fetchMock.mock.calls[2][1] as RequestInit;
    expect(new Headers(retryInit.headers).get('Authorization')).toBe('Bearer fresh-token');
  });

  it('always clears local access state after logout', async () => {
    setNativeAccessToken('access-logout');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ success: true, data: { loggedOut: true } }));

    await nativeLogout();

    expect(getNativeAccessToken()).toBeNull();
    expect(sessionStorage.getItem('electroobuddy_api_access_token')).toBeNull();
  });
});
