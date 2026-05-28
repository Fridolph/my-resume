import { describe, expect, it } from 'vitest'

import {
  AI_CONNECTIVITY_SYSTEM_PROMPT,
  AI_CONNECTIVITY_USER_PROMPT,
} from '../ai-connectivity.prompt'

describe('AI connectivity prompt', () => {
  it('keeps the health-check prompt short and non-business-specific', () => {
    expect(AI_CONNECTIVITY_SYSTEM_PROMPT).toContain('health-check')
    expect(AI_CONNECTIVITY_USER_PROMPT).toContain('OK')
    expect(AI_CONNECTIVITY_USER_PROMPT).toContain('AI model is reachable')
  })
})
