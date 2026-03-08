import { Controller, Get, Inject } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { ReleasesService } from './releases.service.js'

@Controller('public/release')
export class ReleasesPublicController {
  constructor(@Inject(ReleasesService) private readonly releasesService: ReleasesService) {}

  @Public()
  @Get()
  async getActiveRelease() {
    return await this.releasesService.getActivePublicReleaseSnapshot()
  }
}
