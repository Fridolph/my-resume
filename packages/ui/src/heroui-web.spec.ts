import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

function readWebCss() {
  const currentFile = fileURLToPath(import.meta.url)
  return readFileSync(resolve(dirname(currentFile), 'heroui-web.css'), 'utf8')
}

describe('heroui-web.css', () => {
  it('should include Skeleton styles for the current web runtime usage', () => {
    const css = readWebCss()

    expect(css).toContain("@import '@heroui/styles/components/skeleton.css' layer(components);")
  })
})
