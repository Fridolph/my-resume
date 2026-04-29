import { describe, expect, it } from 'vitest'

import {
  buildResumeImportJsonParseDiagnostics,
  buildResumeImportJsonRepairPrompt,
  extractResumeImportJsonObject,
  parseResumeImportProviderPayload,
  repairResumeImportJsonSyntaxLocally,
} from '../utils/resume-import-json'

describe('resume import JSON helpers', () => {
  it('extracts and parses a valid provider JSON payload', () => {
    const jsonText = extractResumeImportJsonObject(
      '```json\n{"summary":"ok","resume":{"profile":{}}}\n```',
    )
    const parsed = parseResumeImportProviderPayload(jsonText)

    expect(parsed.payload.summary).toBe('ok')
    expect(parsed.payload.resume).toEqual(expect.objectContaining({ profile: {} }))
    expect(parsed.details.join('\n')).toContain('顶层字段')
  })

  it('builds readable diagnostics around JSON parse positions', () => {
    const jsonText = '{"summary":"ok" "resume":{}}'
    let error: unknown

    try {
      JSON.parse(jsonText)
    } catch (caughtError) {
      error = caughtError
    }

    const details = buildResumeImportJsonParseDiagnostics(jsonText, error)

    expect(details.join('\n')).toContain('原始解析错误')
    expect(details.join('\n')).toContain('错误位置附近片段')
    expect(details.join('\n')).toContain('summary')
  })

  it('builds a repair prompt that asks the provider to preserve semantics', () => {
    const prompt = buildResumeImportJsonRepairPrompt({
      jsonText: '{"summary":"ok" "resume":{}}',
      parseError: 'Expected comma',
    })

    expect(prompt).toContain('只修复 JSON 语法')
    expect(prompt).toContain('不要改写字段语义')
    expect(prompt).toContain('Expected comma')
  })

  it('locally repairs common missing commas before falling back to provider repair', () => {
    const repaired = repairResumeImportJsonSyntaxLocally(
      '{"summary":"ok" "resume":{"highlights":[{"title":"A"} {"title":"B"}]}}',
    )

    expect(repaired).toBeTruthy()
    expect(JSON.parse(repaired ?? '{}')).toMatchObject({
      summary: 'ok',
      resume: {
        highlights: [{ title: 'A' }, { title: 'B' }],
      },
    })
  })
})
