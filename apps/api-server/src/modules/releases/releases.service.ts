import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { activateContentRelease, createAndActivateContentRelease, getActivePublicReleaseSnapshot, listContentReleases } from '@repo/database'
import type { UserSession } from '@repo/types'

@Injectable()
export class ReleasesService {
  async listContentReleases() {
    return await listContentReleases()
  }

  async publishContentRelease(currentUser: UserSession) {
    try {
      return await createAndActivateContentRelease(currentUser)
    } catch (error) {
      throw new BadRequestException({
        code: 'CONTENT_RELEASE_PUBLISH_FAILED',
        message: error instanceof Error ? error.message : '统一发布失败。'
      })
    }
  }

  async activateContentRelease(releaseId: string, currentUser: UserSession) {
    try {
      return await activateContentRelease(releaseId, currentUser)
    } catch (error) {
      throw new NotFoundException(`Content release ${releaseId} not found`)
    }
  }

  async getActivePublicReleaseSnapshot() {
    return await getActivePublicReleaseSnapshot()
  }
}
