import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { AuthUserSeedService } from './application/services/auth-user-seed.service'
import { AuthService } from './application/services/auth.service'
import { PasswordHashService } from './application/services/password-hash.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from './guards/role-capabilities.guard'
import { AuthUserRepository } from './infrastructure/repositories/auth-user.repository'
import { AuthController } from './transport/controllers/auth.controller'
import { AuthDemoController } from './transport/controllers/auth-demo.controller'

@Module({
  imports: [
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ??
        process.env.AUTH_JWT_SECRET ??
        'my-resume-dev-jwt-secret',
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AuthController, AuthDemoController],
  providers: [
    AuthUserRepository,
    PasswordHashService,
    AuthUserSeedService,
    AuthService,
    JwtAuthGuard,
    RoleCapabilitiesGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
