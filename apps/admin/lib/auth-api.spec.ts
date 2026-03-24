import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchCurrentUser,
  loginWithPassword,
  postProtectedAction,
} from './auth-api';

describe('auth api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should call the NestJS login endpoint and return login result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'demo-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: 'admin-demo-user',
            username: 'admin',
            role: 'admin',
            isActive: true,
            capabilities: {
              canTriggerAiAnalysis: true,
            },
          },
        }),
      }),
    );

    const loginResult = await loginWithPassword({
      apiBaseUrl: 'http://localhost:3001',
      username: 'admin',
      password: 'admin123456',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/auth/login',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(loginResult.accessToken).toBe('demo-token');
    expect(loginResult.user.username).toBe('admin');
  });

  it('should call the protected current-user endpoint with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'viewer-demo-user',
            username: 'viewer',
            role: 'viewer',
            isActive: true,
            capabilities: {
              canEditResume: false,
            },
          },
        }),
      }),
    );

    const currentUser = await fetchCurrentUser({
      apiBaseUrl: 'http://localhost:3001',
      accessToken: 'demo-token',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/auth/me',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer demo-token',
        },
      }),
    );
    expect(currentUser.username).toBe('viewer');
  });

  it('should post protected action with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: 'ok',
        }),
      }),
    );

    const response = await postProtectedAction({
      apiBaseUrl: 'http://localhost:3001',
      accessToken: 'demo-token',
      pathname: '/auth/demo/publish',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/auth/demo/publish',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo-token',
        },
      }),
    );
    expect(response.message).toBe('ok');
  });
});
