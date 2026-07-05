import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'

import { AiChatRepository } from './ai-chat.repository'
import { buildLocalDateKey } from './ai-chat.utils'

/**
 * AiChatSessionBundle 从 Repository 的 getSessionBundle 返回值推导，
 * 保持与原始定义的兼容性。
 */
export type AiChatSessionBundle = NonNullable<
  Awaited<ReturnType<AiChatRepository['getSessionBundle']>>
>

/** 公开聊天（public-ip 来源）标记常量 */
const PUBLIC_CHAT_SOURCE_TAG = 'public-ip'
const PUBLIC_CHAT_ISSUER = 'system-public-chat'

function isSameLocalDate(left: Date, right: Date) {
  return buildLocalDateKey(left) === buildLocalDateKey(right)
}

/**
 * 判断 bundle 是否属于公开聊天（public-ip 来源）。
 */
function isPublicChatBundle(bundle: AiChatSessionBundle) {
  return (
    bundle.lead.sourceTag === PUBLIC_CHAT_SOURCE_TAG ||
    bundle.useKey.issuedByUserId === PUBLIC_CHAT_ISSUER
  )
}

/**
 * AiChatQuotaService —— 对话配额 & 准入校验。
 *
 * 从 AiChatService 中抽离，集中管理以下职责：
 * - 会话加载与存在性校验
 * - useKey 匹配性 / 状态有效性
 * - 会话开关状态 & 轮次配额
 * - 公开聊天自然日配额刷新
 */
@Injectable()
export class AiChatQuotaService {
  private readonly logger = new Logger(AiChatQuotaService.name)

  constructor(private readonly repository: AiChatRepository) {}

  // ── 原子校验方法 ──

  /**
   * 加载会话 bundle，不存在时抛出 NotFoundException。
   */
  async getBundleOrThrow(sessionId: string): Promise<AiChatSessionBundle> {
    const bundle = await this.repository.getSessionBundle(sessionId)

    if (!bundle) {
      throw new NotFoundException('AI chat session not found')
    }

    return bundle
  }

  /**
   * 公开聊天自然日配额刷新：跨自然日时重置 usedTurns。
   *
   * 非公开聊天 / useKey 已失效 / 同日已刷新 → 直接返回原 bundle。
   */
  async refreshDailyQuota(
    bundle: AiChatSessionBundle,
  ): Promise<AiChatSessionBundle> {
    const now = new Date()

    if (
      !isPublicChatBundle(bundle) ||
      bundle.useKey.status === 'revoked' ||
      bundle.useKey.status === 'expired' ||
      isSameLocalDate(bundle.session.updatedAt, now)
    ) {
      return bundle
    }

    await this.repository.resetSessionTurns({
      sessionId: bundle.session.id,
      useKeyId: bundle.useKey.id,
      now,
    })

    const refreshedBundle = await this.repository.getSessionBundle(
      bundle.session.id,
    )

    if (!refreshedBundle) {
      throw new NotFoundException('AI chat session not found')
    }

    return refreshedBundle
  }

  /**
   * 断言 useKey 值与当前会话的 useKey 一致。
   */
  assertUseKeyMatch(bundle: AiChatSessionBundle, useKeyValue: string): void {
    if (bundle.useKey.useKey !== useKeyValue) {
      throw new ForbiddenException('当前会话与 useKey 不匹配')
    }
  }

  /**
   * 断言 useKey 未失效（非 revoked / expired）。
   */
  assertUseKeyActive(bundle: AiChatSessionBundle): void {
    if (
      bundle.useKey.status === 'revoked' ||
      bundle.useKey.status === 'expired'
    ) {
      throw new ForbiddenException('当前 useKey 不可继续使用')
    }
  }

  /**
   * 断言会话仍可继续提问（非 closed 且轮次未达上限）。
   */
  assertSessionOpen(bundle: AiChatSessionBundle): void {
    if (
      bundle.session.status === 'closed' ||
      bundle.session.turnCount >= bundle.useKey.maxTurns
    ) {
      throw new BadRequestException('当前会话已结束，无法继续提问')
    }
  }

  // ── 组合校验 —— 覆盖最常见的准入链路 ──

  /**
   * 一站式准入校验：加载会话 → 校验 useKey 匹配 → 校验 useKey 有效 →
   * 刷新日配额 → 校验会话未关闭。
   *
   * 返回经过日配额刷新后的 bundle。
   */
  async validateAndRefresh(params: {
    sessionId: string
    useKey: string
  }): Promise<AiChatSessionBundle> {
    const bundle = await this.getBundleOrThrow(params.sessionId)

    this.assertUseKeyMatch(bundle, params.useKey)
    this.assertUseKeyActive(bundle)

    const refreshed = await this.refreshDailyQuota(bundle)

    this.assertSessionOpen(refreshed)

    return refreshed
  }
}
