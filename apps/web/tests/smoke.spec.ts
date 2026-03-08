import { expect, test } from '@playwright/test'

test.describe('Web smoke', () => {
  test('首页可以加载关键公开内容', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Fridolph Web/i })).toBeVisible()
    await expect(page.getByRole('link', { name: '简历' })).toBeVisible()
    await expect(page.getByRole('link', { name: '项目' })).toBeVisible()
    await expect(page.getByText('Public Content API')).toBeVisible()
  })

  test('简历页可以渲染结构化简历内容', async ({ page }) => {
    await page.goto('/resume')

    await expect(page.getByRole('heading', { name: /在线简历|Resume/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /基础信息|Profile/i })).toBeVisible()
    await expect(page.getByText(/高级前端工程师|Nuxt 全栈方向|Senior Frontend Engineer/i)).toBeVisible()
  })

  test('项目列表页可以展示项目卡片并提供详情入口', async ({ page }) => {
    await page.goto('/projects')

    await expect(page.getByRole('heading', { name: /项目列表|Projects/i })).toBeVisible()
    await expect(page.getByText(/Resume Platform/i).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /查看详情|View Details|查看页面/i }).first()).toBeVisible()
  })

  test('项目详情页可以访问并返回列表页', async ({ page }) => {
    await page.goto('/projects/resume-platform')

    await expect(page.getByRole('heading', { name: /Resume Platform|resume-platform/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /返回项目列表|Back to Projects/i })).toBeVisible()
  })
})
