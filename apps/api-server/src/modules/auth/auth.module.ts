import { Global, Module } from '@nestjs/common'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, ApiAuthGuard],
  exports: [AuthService, ApiAuthGuard]
})
export class AuthModule {}
