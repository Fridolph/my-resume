'use client'

import { Button, Modal } from '@heroui/react'

import { useAiChat } from './ai-chat-context'

export function AiChatConsentModal({ locale }: { locale: 'zh' | 'en' }) {
  const {
    acceptConsent,
    dismissConsentModal,
    errorMessage,
    isBootstrappingSession,
    isConsentModalOpen,
  } = useAiChat()

  return (
    <Modal.Backdrop
      isDismissable={!isBootstrappingSession}
      isOpen={isConsentModalOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isBootstrappingSession) {
          dismissConsentModal()
        }
      }}>
      <Modal.Container className="px-4" placement="center" size="lg">
        <Modal.Dialog className="rounded-[2rem] border border-zinc-200/80 bg-white/96 shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-950/96">
          <Modal.Header className="grid gap-2 border-b border-zinc-200/80 px-6 py-5 dark:border-zinc-800">
            <div className="inline-flex w-fit items-center rounded-full border border-sky-200/80 bg-sky-500/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
              {locale === 'en' ? 'Privacy notice' : '访客提示'}
            </div>
            <div className="grid gap-1">
              <Modal.Heading className="text-2xl font-semibold tracking-[-0.05em] text-zinc-950 dark:text-white">
                {locale === 'en' ? 'Start AI chat' : '开始 AI 对话'}
              </Modal.Heading>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {locale === 'en'
                  ? 'Before chatting, please confirm the minimal privacy notice for this public AI entry.'
                  : '在开始对话前，请先确认这条公开站 AI 入口的最小隐私提示。'}
              </p>
            </div>
          </Modal.Header>

          <Modal.Body className="grid gap-4 px-6 py-5">
            <div className="grid gap-3 rounded-[1.5rem] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
                {locale === 'en'
                  ? 'We will record your current IP address only for access control, abuse prevention, and the daily turn limit. Overseas IP restriction is not enforced in this MVP, but the entry is still resume-only.'
                  : '我们会记录你当前的 IP 地址，仅用于访问控制、滥用防护和每日轮次限制。本次 MVP 暂不严格执行海外 IP 拦截，但该入口依然只用于围绕当前简历展开对话。'}
              </p>
              <ul className="grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                <li>{locale === 'en' ? 'Only resume-related questions are supported.' : '只支持与当前简历、项目、经历和技能相关的问题。'}</li>
                <li>{locale === 'en' ? 'Each IP can ask up to 20 questions per day.' : '每个 IP 每天最多可提问 20 次。'}</li>
                <li>{locale === 'en' ? 'Your IP will not be used for unrelated purposes.' : '记录到的 IP 不会用于与本功能无关的其他用途。'}</li>
              </ul>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                {errorMessage}
              </div>
            ) : null}
          </Modal.Body>

          <Modal.Footer className="flex items-center justify-end gap-3 border-t border-zinc-200/80 px-6 py-4 dark:border-zinc-800">
            <Button isDisabled={isBootstrappingSession} onPress={dismissConsentModal} variant="ghost">
              {locale === 'en' ? 'Cancel' : '暂不进入'}
            </Button>
            <Button isDisabled={isBootstrappingSession} onPress={() => void acceptConsent()} variant="primary">
              {isBootstrappingSession
                ? locale === 'en'
                  ? 'Starting...'
                  : '启动中...'
                : locale === 'en'
                  ? 'Agree and continue'
                  : '同意并继续'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
