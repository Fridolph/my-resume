import { describe, expect, it } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { UserRole } from './domain/user-role.enum';

describe('AuthService', () => {
  const jwtService = new JwtService({
    secret: 'test-jwt-secret',
    signOptions: {
      expiresIn: '1h',
    },
  });

  const authService = new AuthService(jwtService);

  it('should issue an access token for the admin demo account', async () => {
    const loginResult = await authService.login({
      username: 'admin',
      password: 'admin123456',
    });

    expect(loginResult.tokenType).toBe('Bearer');
    expect(loginResult.accessToken).toEqual(expect.any(String));
    expect(loginResult.user).toMatchObject({
      username: 'admin',
      role: UserRole.ADMIN,
      isActive: true,
    });
    expect(loginResult.user.capabilities.canTriggerAiAnalysis).toBe(true);
  });

  it('should reject invalid credentials', async () => {
    await expect(
      authService.login({
        username: 'admin',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid credentials');
  });
});
