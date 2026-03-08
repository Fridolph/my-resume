import { Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common'
import type { UserSession } from '@repo/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import { ReleasesService } from './releases.service.js'

@Controller('admin/releases')
export class ReleasesController {
  constructor(@Inject(ReleasesService) private readonly releasesService: ReleasesService) {}

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('site.read')
  @Get()
  async listContentReleases() {
    return await this.releasesService.listContentReleases()
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('site.write')
  @Post('publish')
  async publishContentRelease(@CurrentUser() currentUser: UserSession) {
    return await this.releasesService.publishContentRelease(currentUser)
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('site.write')
  @Post(':releaseId/activate')
  async activateContentRelease(@Param('releaseId') releaseId: string, @CurrentUser() currentUser: UserSession) {
    return await this.releasesService.activateContentRelease(releaseId, currentUser)
  }
}
