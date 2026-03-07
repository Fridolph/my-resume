import { Controller, Get, Inject } from '@nestjs/common'
import { DatabaseService } from '../database/database.service.js'

@Controller('health')
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  @Get()
  async getHealth() {
    return {
      status: 'ok',
      app: 'my-resume-api',
      timestamp: new Date().toISOString(),
      database: await this.databaseService.getHealthSnapshot()
    }
  }
}
