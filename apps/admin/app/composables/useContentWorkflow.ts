import type { ContentActorSummary, PublishStatus } from '@repo/types'
import { getAllowedPublishStatusTransitions, publishStatusLabels } from '@repo/types'

const publishStatusColors: Record<PublishStatus, 'warning' | 'success' | 'error' | 'info'> = {
  draft: 'warning',
  reviewing: 'info',
  published: 'success',
  archived: 'error'
}

const primaryTransitionMap: Record<PublishStatus, { to: PublishStatus, label: string } | null> = {
  draft: { to: 'reviewing', label: '提交审核' },
  reviewing: { to: 'published', label: '批准发布' },
  published: { to: 'draft', label: '撤回草稿' },
  archived: { to: 'draft', label: '恢复草稿' }
}

export function useContentWorkflow() {
  function getStatusLabel(status: PublishStatus) {
    return publishStatusLabels[status]
  }

  function getStatusColor(status: PublishStatus) {
    return publishStatusColors[status]
  }

  function getSelectableStatusOptions(currentStatus: PublishStatus) {
    return [currentStatus, ...getAllowedPublishStatusTransitions(currentStatus)].map(status => ({
      value: status,
      label: getStatusLabel(status)
    }))
  }

  function getPrimaryTransitionAction(status: PublishStatus) {
    return primaryTransitionMap[status]
  }

  function getActorLabel(actor: ContentActorSummary | null | undefined) {
    if (!actor) {
      return '暂无'
    }

    return `${actor.name} · ${actor.email}`
  }

  function getPublishedAtLabel(value: string | null | undefined) {
    return value ? new Date(value).toLocaleString() : '暂无'
  }

  return {
    getStatusLabel,
    getStatusColor,
    getSelectableStatusOptions,
    getPrimaryTransitionAction,
    getActorLabel,
    getPublishedAtLabel
  }
}
