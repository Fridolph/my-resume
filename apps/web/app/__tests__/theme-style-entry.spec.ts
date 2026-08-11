import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const appDirectory = resolve(currentDirectory, '..')

const componentStyleFiles = [
  '[locale]/_resume/hero.css',
  '[locale]/_resume/published-resume-card-surface.css',
  '[locale]/_resume/published-resume-section-card.css',
  '[locale]/_resume/published-resume-skills-section.css',
  '[locale]/ai-talk/_ai-talk/entry-shell.css',
]

describe('web theme style entry', () => {
  it('should keep the Tailwind entry and dark variant configuration in globals.css only', () => {
    const globalsCss = readFileSync(resolve(appDirectory, 'globals.css'), 'utf8')

    expect(globalsCss).toContain("@import 'tailwindcss';")
    expect(globalsCss).toContain('@custom-variant dark')

    componentStyleFiles.forEach((filePath) => {
      const styleContent = readFileSync(resolve(appDirectory, filePath), 'utf8')

      expect(styleContent).not.toMatch(/@import\s+["']tailwindcss["']/)
    })
  })

  it('should use @reference instead of a second Tailwind entry when local CSS uses @apply', () => {
    const entryShellCss = readFileSync(
      resolve(appDirectory, '[locale]/ai-talk/_ai-talk/entry-shell.css'),
      'utf8',
    )

    expect(entryShellCss).toContain('@reference "../../../globals.css";')
  })
})
