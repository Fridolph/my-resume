import type { ContentActorSummary, PublishStatus, UserSession } from '@repo/types'

export function toContentActorSummary(actor: Pick<UserSession, 'id' | 'name' | 'email'>): ContentActorSummary {
  return {
    id: actor.id,
    name: actor.name,
    email: actor.email
  }
}

export function createSystemActor(): ContentActorSummary {
  return {
    id: 'system',
    name: 'System Seed',
    email: 'system@local'
  }
}

export interface ResolveContentAuditInput {
  currentStatus?: PublishStatus
  nextStatus: PublishStatus
  currentPublishedAt?: string | null
  currentUpdatedBy?: ContentActorSummary | null
  currentReviewedBy?: ContentActorSummary | null
  actor: Pick<UserSession, 'id' | 'name' | 'email'>
  timestamp?: string
}

export function resolveContentAuditFields(input: ResolveContentAuditInput) {
  const actor = toContentActorSummary(input.actor)
  const timestamp = input.timestamp ?? new Date().toISOString()
  const currentStatus = input.currentStatus

  if (input.nextStatus === 'published') {
    return {
      updatedBy: actor,
      reviewedBy: currentStatus === 'published' ? (input.currentReviewedBy ?? actor) : actor,
      publishedAt: currentStatus === 'published' ? (input.currentPublishedAt ?? timestamp) : timestamp
    }
  }

  return {
    updatedBy: actor,
    reviewedBy: null,
    publishedAt: null
  }
}
