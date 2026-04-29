import {
  Controller,
  Get,
  Inject,
  Redirect,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { SkipResponseEnvelope } from './common/decorators/skip-response-envelope.decorator'
import { ApiEnvelopeResponse } from './common/swagger/api-envelope-response.decorator'
import { AppService, type HealthCheckResponse } from './app.service'
import { AiService } from './modules/ai/ai.service'
import { API_HEALTH_PATH } from './server-api-prefix'

export interface AiConnectivityCheckResponse {
  ok: true
  status: 'ok'
  provider: string
  model: string
  mode: string
  latencyMs: number
  sample: string
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Unknown AI provider connectivity error'
}

@Controller()
@ApiTags('System')
export class AppController {
  constructor(
    @Inject(AppService) private readonly appService: AppService,
    @Inject(AiService) private readonly aiService: AiService,
  ) {}

  @Get()
  @Redirect(API_HEALTH_PATH, 302)
  @SkipResponseEnvelope()
  @ApiOperation({
    summary: '根路径跳转健康检查',
    description: '将 api-server 根路径跳转到明确的健康检查入口。',
  })
  redirectRootToHealth(): void {
    return undefined
  }

  @Get('api')
  @ApiOperation({
    summary: '服务健康检查',
    description: '兼容旧版 /api 健康检查入口，返回服务基础运行状态。',
  })
  @ApiEnvelopeResponse({
    description: '健康检查成功',
  })
  getHealth(): HealthCheckResponse {
    return this.appService.getHealth()
  }

  @Get('health')
  @ApiOperation({
    summary: '服务健康检查',
    description: '推荐用于运维巡检的显式健康检查入口。',
  })
  @ApiEnvelopeResponse({
    description: '健康检查成功',
  })
  getExplicitHealth(): HealthCheckResponse {
    return this.appService.getHealth()
  }

  @Get('ai-is-ok')
  @ApiOperation({
    summary: 'AI 模型链路快速检测',
    description: '向当前 AI provider 发送一次极小文本生成请求，用于确认模型链路可用。',
  })
  @ApiEnvelopeResponse({
    description: 'AI 模型链路可用',
  })
  async checkAiConnectivity(): Promise<AiConnectivityCheckResponse> {
    return this.runAiConnectivityCheck()
  }

  @Get('api/ai-is-ok')
  @ApiOperation({
    summary: 'AI 模型链路快速检测',
    description: '兼容 /api/ai-is-ok 访问方式，同样会真实调用当前 AI provider。',
  })
  @ApiEnvelopeResponse({
    description: 'AI 模型链路可用',
  })
  async checkPrefixedAiConnectivity(): Promise<AiConnectivityCheckResponse> {
    return this.runAiConnectivityCheck()
  }

  private async runAiConnectivityCheck(): Promise<AiConnectivityCheckResponse> {
    const startedAt = Date.now()
    const providerSummary = this.aiService.getProviderSummary()

    try {
      const result = await this.aiService.generateText({
        systemPrompt:
          'You are a production health-check endpoint. Reply with a very short confirmation.',
        prompt: 'Reply with OK only if this AI model is reachable.',
        temperature: 0,
      })

      return {
        ok: true,
        status: 'ok',
        provider: result.provider,
        model: result.model,
        mode: providerSummary.mode,
        latencyMs: Date.now() - startedAt,
        sample: result.text.trim().slice(0, 120),
      }
    } catch (error) {
      throw new ServiceUnavailableException(
        `AI provider connectivity check failed: ${normalizeErrorMessage(error)}`,
      )
    }
  }
}
