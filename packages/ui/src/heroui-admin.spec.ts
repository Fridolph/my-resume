import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

function readAdminCss() {
  const currentFile = fileURLToPath(import.meta.url)
  return readFileSync(resolve(dirname(currentFile), 'heroui-admin.css'), 'utf8')
}

describe('heroui-admin.css', () => {
  it('should use the consolidated HeroUI components entry', () => {
    const css = readAdminCss()

    expect(css).toContain("@import '@heroui/styles/components/index.css' layer(components);")
    expect(css).not.toMatch(/@import '@heroui\/styles\/components\/(?!index\.css)[^']+\.css'/)
  })

  it('should include tw-animate-css for overlay animations', () => {
    const css = readAdminCss()

    expect(css).toContain("@import 'tw-animate-css';")
  })
})
