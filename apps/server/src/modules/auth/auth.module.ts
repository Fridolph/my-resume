import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthDemoController } from './auth-demo.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleCapabilitiesGuard } from './guards/role-capabilities.guard';

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
  providers: [AuthService, JwtAuthGuard, RoleCapabilitiesGuard],
  exports: [AuthService],
})
export class AuthModule {}
