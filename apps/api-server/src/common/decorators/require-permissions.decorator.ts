import { SetMetadata } from '@nestjs/common'
import type { PermissionKey } from '@repo/types'

export const REQUIRED_PERMISSIONS = 'requiredPermissions'

export const RequirePermissions = (...permissions: PermissionKey[]) => SetMetadata(REQUIRED_PERMISSIONS, permissions)
