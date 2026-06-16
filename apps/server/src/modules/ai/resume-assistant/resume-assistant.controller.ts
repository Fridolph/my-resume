/**
 * 简历完整性助手 — SSE 流式控制器。
 */

import { Controller, Post, Req, Res } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'

import { ResumeAssistantService } from './resume-assistant.service'

@ApiTags('AI Resume Assistant')
@Controller('api/ai/resume-assistant')
export class ResumeAssistantController {
  constructor(private readonly service: ResumeAssistantService) {}

  @Post('stream')
  @ApiOperation({ summary: '流式对话（SSE）' })
  async stream(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { message, history } = req.body ?? {}

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    try {
      const resume = await this.service.getResume()
      await this.service.stream(
        resume,
        message,
        Array.isArray(history) ? history : [],
        {
          onToken: (token) => sendEvent('token', { text: token }),
          onSuggestion: (suggestion) => sendEvent('suggestion', suggestion),
          onCompleteness: (completeness) => sendEvent('completeness', completeness),
          onError: (error) => sendEvent('error', { message: error }),
        },
      )
    } catch (error) {
      sendEvent('error', {
        message: error instanceof Error ? error.message : String(error),
      })
    }

    sendEvent('done', {})
    res.end()
  }

  @Post('sync')
  @ApiOperation({ summary: '校验完整度并同步建议到简历草稿' })
  async sync(): Promise<{ ok: boolean; message: string }> {
    const resume = await this.service.getResume()
    const completeness = this.service.calculateCompleteness(resume)
    const allComplete = this.service.isAllComplete(completeness)

    if (!allComplete) {
      const missing = completeness
        .filter((item) => item.status !== 'complete')
        .map((item) => item.label)
      return { ok: false, message: `以下版块尚未完成：${missing.join('、')}` }
    }

    // TODO: 在后续 Issue 中实现同步逻辑
    return { ok: true, message: '同步成功' }
  }
}
