import { SetMetadata } from '@nestjs/common'

export const SKIP_RESPONSE_ENVELOPE = 'skip-response-envelope'

/**
 * Skip standard response envelope for raw response handlers
 */
export const SkipResponseEnvelope = () => SetMetadata(SKIP_RESPONSE_ENVELOPE, true)
