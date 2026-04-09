import { SetMetadata } from '@nestjs/common'

import type { RoleCapabilityKey } from '../domain/auth-role-policy'

export const REQUIRED_ROLE_CAPABILITY = 'required-role-capability'

export const RequireCapability = (capability: RoleCapabilityKey) =>
  SetMetadata(REQUIRED_ROLE_CAPABILITY, capability)
