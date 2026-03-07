import type { PermissionKey } from '@repo/types'

export function usePermissions() {
  const { session } = useAuth()

  const permissions = computed(() => session.value?.permissions ?? [])

  function hasPermission(permission: PermissionKey) {
    return permissions.value.includes(permission)
  }

  function requirePermission(permission: PermissionKey) {
    if (!hasPermission(permission)) {
      return navigateTo('/unauthorized')
    }
  }

  return {
    permissions,
    hasPermission,
    requirePermission
  }
}
