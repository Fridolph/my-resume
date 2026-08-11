import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const appDirectory = resolve(currentDirectory, '..')

describe('admin theme style entry', () => {
  it('should keep the shell display styles and global Tailwind context separate', () => {
    const shellCss = readFileSync(resolve(appDirectory, 'admin-shell.css'), 'utf8')

    expect(shellCss).toContain("@import '@my-resume/ui/display.css';")
    expect(shellCss).toContain('@reference \'./globals.css\';')
    expect(shellCss).not.toMatch(/@import\s+["']tailwindcss["']/)
  })

  it('should make shared display tokens respond to the admin dark class', () => {
    const displayCss = readFileSync(
      resolve(appDirectory, '../../../packages/ui/src/display.css'),
      'utf8',
    )

    expect(displayCss).toContain("html[data-theme='dark'],\nhtml.dark")
  })
})
