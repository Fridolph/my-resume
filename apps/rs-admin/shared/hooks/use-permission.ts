'use client'

import type { RoleCapabilities } from '@my-resume/api-client'

import { useAuth } from '@shared/lib/auth/auth-context'

type CapabilityKey = keyof RoleCapabilities

/**
 * 权限判断 composable：基于当前用户 capabilities（来自 /auth/me）。
 */
export function usePermission() {
  const { user } = useAuth()
  const capabilities = user?.capabilities ?? {}

  function hasCapability(key: CapabilityKey): boolean {
    return Boolean(capabilities[key])
  }

  return { capabilities, hasCapability, user }
}
