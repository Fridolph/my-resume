import { describe, expect, it } from 'vitest'

import {
  buildRoleCapabilities,
  canAccessAdminSurface,
  canEditResume,
  canPublishResume,
  canReadPublishedResume,
  canReadViewerExperience,
  canTriggerAiAnalysis,
} from '../auth-role-policy'
import { UserRole } from '../user-role.enum'

describe('auth role policy', () => {
  it('should allow admin to access all current role capabilities', () => {
    expect(canAccessAdminSurface(UserRole.ADMIN)).toBe(true)
    expect(canReadPublishedResume(UserRole.ADMIN)).toBe(true)
    expect(canReadViewerExperience(UserRole.ADMIN)).toBe(true)
    expect(canEditResume(UserRole.ADMIN)).toBe(true)
    expect(canPublishResume(UserRole.ADMIN)).toBe(true)
    expect(canTriggerAiAnalysis(UserRole.ADMIN)).toBe(true)
  })

  it('should keep viewer read-only in current milestone scope', () => {
    expect(canAccessAdminSurface(UserRole.VIEWER)).toBe(true)
    expect(canReadPublishedResume(UserRole.VIEWER)).toBe(true)
    expect(canReadViewerExperience(UserRole.VIEWER)).toBe(true)
    expect(canEditResume(UserRole.VIEWER)).toBe(false)
    expect(canPublishResume(UserRole.VIEWER)).toBe(false)
    expect(canTriggerAiAnalysis(UserRole.VIEWER)).toBe(false)
  })

  it('should expose stable capabilities for the current role model', () => {
    expect(buildRoleCapabilities(UserRole.ADMIN)).toEqual({
      canAccessAdminSurface: true,
      canReadPublishedResume: true,
      canReadViewerExperience: true,
      canEditResume: true,
      canPublishResume: true,
      canTriggerAiAnalysis: true,
    })

    expect(buildRoleCapabilities(UserRole.VIEWER)).toEqual({
      canAccessAdminSurface: true,
      canReadPublishedResume: true,
      canReadViewerExperience: true,
      canEditResume: false,
      canPublishResume: false,
      canTriggerAiAnalysis: false,
    })
  })
})
