import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const appDirectory = resolve(currentDirectory, '..')

describe('admin theme style entry', () => {
  it('should load display styles, admin tokens, and the Tailwind context', () => {
    const shellCss = readFileSync(resolve(appDirectory, 'admin-shell.css'), 'utf8')

    expect(shellCss).toContain("@import 'tailwindcss';")
    expect(shellCss).toContain("@import '@my-resume/ui/display.css';")
    expect(shellCss).toContain("@import './admin-tokens.css';")
    expect(shellCss).toContain("@reference './globals.css';")
    expect(shellCss).toContain('border-[color:var(--admin-button-primary-border)]')
    expect(shellCss).toContain('border-[color:var(--admin-border-strong)]')
    expect(shellCss).not.toContain('border-[--admin-')
  })

  it('should make shared display tokens respond to the admin dark class', () => {
    const displayCss = readFileSync(
      resolve(appDirectory, '../../../packages/ui/src/display.css'),
      'utf8',
    )

    expect(displayCss).toContain("html[data-theme='dark'],\nhtml.dark")
  })

  it('should define a three-layer admin token contract with compatibility aliases', () => {
    const tokensCss = readFileSync(resolve(appDirectory, 'admin-tokens.css'), 'utf8')
    const globalsCss = readFileSync(resolve(appDirectory, 'globals.css'), 'utf8')

    expect(globalsCss).toContain("@import './admin-tokens.css';")
    expect(tokensCss).toContain('/* Primitive tokens: raw values only. */')
    expect(tokensCss).toContain(
      '/* Semantic tokens: use these for page, surface, text, border, and status UI. */',
    )
    expect(tokensCss).toContain(
      '/* Component tokens: only component recipes should consume these directly. */',
    )
    expect(tokensCss).toContain('--admin-color-surface:')
    expect(tokensCss).toContain('--admin-component-button-primary-bg:')
    expect(tokensCss).toContain('--admin-page-bg: var(--admin-color-page-bg);')
    expect(tokensCss).toContain("html[data-theme='dark'],\nhtml.dark,\n.dark")
    expect(tokensCss).toContain('--admin-color-text: #f5f7fb;')
  })
})
