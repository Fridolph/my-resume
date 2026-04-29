import { Injectable } from '@nestjs/common'

export interface HealthCheckResponse {
  status: 'ok'
  service: 'my-resume-api'
  uptimeSeconds: number
  timestamp: string
}

@Injectable()
export class AppService {
  getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      service: 'my-resume-api',
      uptimeSeconds: Number(process.uptime().toFixed(3)),
      timestamp: new Date().toISOString(),
    }
  }
}
