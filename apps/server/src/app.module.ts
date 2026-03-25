import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { buildServerEnvFilePaths } from './config/env-paths';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: buildServerEnvFilePaths(process.env.NODE_ENV),
    }),
    AuthModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
