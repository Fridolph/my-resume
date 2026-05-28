import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Request, Response } from 'express'

import { ApiEnvelopeResponse } from '../../../../common/swagger/api-envelope-response.decorator'
import { RequireCapability } from '../../../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../../../auth/guards/role-capabilities.guard'
import { CurrentAuthUser } from '../../../auth/decorators/current-auth-user.decorator'
import type { AuthUser } from '../../../auth/domain/auth-user'
import { AiChatIssueUseKeyBodyDto, AiChatLeadBodyDto, AiChatClaimUseKeyBodyDto, AiChatAskMessageBodyDto, AiChatCloseSessionBodyDto, AiChatClaimPublicSessionBodyDto } from '../../chat/dto/ai-chat-swagger.dto'
import { AiChatService } from '../../chat/ai-chat.service'

function resolveClientIp(request: Request) {
  const forwardedFor = request.headers['x-forwarded-for']

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim() || request.ip || ''
  }

  const realIp = request.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim()
  }

  return request.ip || ''
}

function writeSseEvent(response: Response, event: string, data: unknown) {
  response.write(`event: ${event}\n`)
  response.write(`data: ${JSON.stringify(data)}\n\n`)
}

@Controller('ai/chat')
@ApiTags('AI Chat')
export class AiChatController {
  constructor(
    @Inject(AiChatService)
    private readonly aiChatService: AiChatService,
  ) {}

  @Post('leads')
  @ApiOperation({
    summary: '提交公开站 AI Chat 线索',
    description: '访客提交姓名/公司、联系方式与留言，等待管理员发放 useKey。',
  })
  @ApiEnvelopeResponse({ description: '线索提交成功' })
  submitLead(@Body() body: AiChatLeadBodyDto) {
    return this.aiChatService.submitLead({
      displayName: body.displayName,
      companyName: body.companyName,
      contact: body.contact,
      message: body.message,
      locale: body.locale ?? 'zh',
    })
  }

  @Post('usekey/claim')
  @ApiOperation({
    summary: '认领 useKey 并恢复公开站会话',
    description: '校验 useKey 后恢复既有会话或创建主会话。',
  })
  @ApiEnvelopeResponse({ description: '认领 useKey 成功' })
  claimUseKey(@Body() body: AiChatClaimUseKeyBodyDto) {
    return this.aiChatService.claimUseKey({
      useKey: body.useKey,
      locale: body.locale,
    })
  }

  @Post('public/claim')
  @ApiOperation({
    summary: '公开站访客确认提示后直接进入 AI Chat',
    description: '按访客 IP 维度恢复或创建当日 20 轮会话；不再要求手动输入 useKey。',
  })
  @ApiEnvelopeResponse({ description: '公开站 AI Chat 会话认领成功' })
  claimPublicSession(
    @Body() body: AiChatClaimPublicSessionBodyDto,
    @Req() request: Request,
  ) {
    return this.aiChatService.claimPublicSession({
      consentAccepted: body.consentAccepted,
      ipAddress: resolveClientIp(request),
      locale: body.locale,
      userAgent:
        typeof request.headers['user-agent'] === 'string'
          ? request.headers['user-agent']
          : null,
    })
  }

  @Get('sessions/:sessionId')
  @ApiOperation({
    summary: '读取公开站 AI Chat 会话快照',
    description: '根据 sessionId 和 useKey 恢复当前会话状态。',
  })
  @ApiParam({ name: 'sessionId', example: 'session-001' })
  @ApiQuery({ name: 'useKey', required: true, example: 'FY-1A2B3C4D' })
  @ApiEnvelopeResponse({ description: '会话快照读取成功' })
  getSession(@Param('sessionId') sessionId: string, @Query('useKey') useKey: string) {
    return this.aiChatService.getPublicSessionSnapshot(sessionId, useKey)
  }

  @Post('sessions/:sessionId/close')
  @ApiOperation({
    summary: '主动结束公开站 AI Chat 会话',
    description: '访客可在达到 20 轮前主动结束会话。',
  })
  @ApiParam({ name: 'sessionId', example: 'session-001' })
  @ApiEnvelopeResponse({ description: '会话结束成功' })
  closeSession(
    @Param('sessionId') sessionId: string,
    @Body() body: AiChatCloseSessionBodyDto,
  ) {
    return this.aiChatService.closeSession({
      sessionId,
      useKey: body.useKey,
    })
  }

  @Post('sessions/:sessionId/messages')
  @ApiOperation({
    summary: '发送公开站 AI Chat 消息并流式返回回答',
    description: '通过 text/event-stream 推送 start/token/citation/block/summary/done/error。该接口不走统一 envelope。',
  })
  @ApiBody({ type: AiChatAskMessageBodyDto })
  async streamMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: AiChatAskMessageBodyDto,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders?.()

    try {
      const result = await this.aiChatService.createAssistantReply(
        {
          sessionId,
          useKey: body.useKey,
          content: body.content,
          locale: body.locale,
        },
        {
          onStart: (payload) => writeSseEvent(response, 'start', payload),
          onToken: (token) => writeSseEvent(response, 'token', { text: token }),
          onCitation: (citation) => writeSseEvent(response, 'citation', citation),
          onBlock: (block) => writeSseEvent(response, 'block', block),
        },
      )

      if (result.summary) {
        writeSseEvent(response, 'summary', result.summary)
      }

      writeSseEvent(response, 'done', {
        session: result.session,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI chat stream failed'
      writeSseEvent(response, 'error', { message })
    } finally {
      response.end()
    }
  }

  @Get('admin/leads')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiForbiddenResponse({ description: '当前角色没有触发 AI 分析权限' })
  @ApiOperation({ summary: '查询 AI Chat 线索列表' })
  @ApiEnvelopeResponse({ description: '线索列表读取成功' })
  listLeads() {
    return this.aiChatService.listLeads()
  }

  @Post('admin/usekeys')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiForbiddenResponse({ description: '当前角色没有触发 AI 分析权限' })
  @ApiOperation({ summary: '为线索发放 AI Chat useKey' })
  @ApiEnvelopeResponse({ description: 'useKey 发放成功' })
  issueUseKey(
    @Body() body: AiChatIssueUseKeyBodyDto,
    @CurrentAuthUser() currentUser: AuthUser,
  ) {
    return this.aiChatService.issueUseKey({
      leadId: body.leadId,
      expiresAt: body.expiresAt,
      locale: body.locale,
      issuedByUserId: currentUser.id,
    })
  }

  @Post('admin/usekeys/:useKey/revoke')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiForbiddenResponse({ description: '当前角色没有触发 AI 分析权限' })
  @ApiOperation({ summary: '作废 AI Chat useKey' })
  @ApiEnvelopeResponse({ description: 'useKey 作废成功' })
  revokeUseKey(@Param('useKey') useKey: string) {
    return this.aiChatService.revokeUseKey(useKey)
  }

  @Get('admin/usekeys')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiForbiddenResponse({ description: '当前角色没有触发 AI 分析权限' })
  @ApiOperation({ summary: '查询 AI Chat useKey 列表' })
  @ApiEnvelopeResponse({ description: 'useKey 列表读取成功' })
  listUseKeys() {
    return this.aiChatService.listUseKeys()
  }

  @Get('admin/sessions')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiForbiddenResponse({ description: '当前角色没有触发 AI 分析权限' })
  @ApiOperation({ summary: '查询 AI Chat 会话列表' })
  @ApiEnvelopeResponse({ description: '会话列表读取成功' })
  listSessions() {
    return this.aiChatService.listSessions()
  }

  @Get('admin/sessions/:sessionId')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiForbiddenResponse({ description: '当前角色没有触发 AI 分析权限' })
  @ApiOperation({ summary: '查询 AI Chat 会话详情' })
  @ApiEnvelopeResponse({ description: '会话详情读取成功' })
  getSessionDetail(@Param('sessionId') sessionId: string) {
    return this.aiChatService.getAdminSessionSnapshot(sessionId)
  }

  @Post('admin/sessions/:sessionId/reset')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiOperation({ summary: '重置会话进度（清空消息 + 归零轮次）' })
  @ApiEnvelopeResponse({ description: '会话重置成功' })
  resetSession(@Param('sessionId') sessionId: string) {
    return this.aiChatService.adminResetSession(sessionId)
  }

  @Post('admin/sessions/:sessionId/messages/clear')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiOperation({ summary: '清空会话聊天记录（保留轮次进度）' })
  @ApiEnvelopeResponse({ description: '聊天记录清空成功' })
  clearMessages(@Param('sessionId') sessionId: string) {
    return this.aiChatService.adminClearMessages(sessionId)
  }

  @Post('admin/usekeys/:useKey/delete')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: '未提供有效 Bearer Token' })
  @ApiOperation({ summary: '删除 useKey（级联清除 session + messages）' })
  @ApiEnvelopeResponse({ description: 'useKey 删除成功' })
  deleteUseKey(@Param('useKey') useKey: string) {
    return this.aiChatService.adminDeleteUseKey(useKey)
  }
}
