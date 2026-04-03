import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';

import { RequireCapability } from '../../auth/decorators/require-capability.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleCapabilitiesGuard } from '../../auth/guards/role-capabilities.guard';
import { RagService } from './rag.service';

interface RagSearchBody {
  query: string;
  limit?: number;
}

interface RagAskBody {
  question: string;
  limit?: number;
  locale?: 'zh' | 'en';
}

@Controller('ai/rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(
    @Inject(RagService)
    private readonly ragService: RagService,
  ) {}

  @Get('status')
  getStatus() {
    return this.ragService.getStatus();
  }

  @Post('index/rebuild')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  rebuildIndex() {
    return this.ragService.rebuildIndex();
  }

  @Post('search')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  search(@Body() body: RagSearchBody) {
    return this.ragService.search(body.query, body.limit);
  }

  @Post('ask')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  ask(@Body() body: RagAskBody) {
    return this.ragService.ask(body.question, body.limit, body.locale);
  }
}
