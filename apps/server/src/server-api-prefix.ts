import { RequestMethod, type INestApplication } from '@nestjs/common'

export const API_HEALTH_PATH = '/api/health'

const GLOBAL_PREFIX_EXCLUDES = [
  { path: '/', method: RequestMethod.GET },
  { path: 'api', method: RequestMethod.GET },
  { path: 'ai-is-ok', method: RequestMethod.GET },
  { path: 'api/ai-is-ok', method: RequestMethod.GET },
]

/**
 * Configure the public API prefix while keeping root-level ops shortcuts explicit.
 */
export function configureApiGlobalPrefix(app: INestApplication): void {
  app.setGlobalPrefix('api', {
    exclude: GLOBAL_PREFIX_EXCLUDES,
  })
}
