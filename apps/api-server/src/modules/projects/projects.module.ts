import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { ProjectsController } from './projects.controller.js'
import { ProjectsPublicController } from './projects-public.controller.js'
import { ProjectsService } from './projects.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [ProjectsController, ProjectsPublicController],
  providers: [ProjectsService]
})
export class ProjectsModule {}
