import { expect, test, type Page } from '@playwright/test'

async function loginAsRoot(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: '登录后台' }).click()
  await expect(page).toHaveURL(/\/$/)
}

test.describe('Admin smoke', () => {
  test('登录后可以进入后台首页', async ({ page }) => {
    await loginAsRoot(page)

    await expect(page.getByRole('heading', { name: /欢迎回来/ })).toBeVisible()
    await expect(page.getByText('Fridolph Super Admin')).toBeVisible()
    await expect(page.getByRole('link', { name: '文案管理' })).toBeVisible()
  })

  test('文案管理页可以展示版本限制提示', async ({ page }) => {
    await loginAsRoot(page)
    await page.getByRole('link', { name: '文案管理' }).click()

    await expect(page.getByRole('heading', { name: '文案管理' })).toBeVisible()
    await page.getByRole('button', { name: '查看版本' }).first().click()
    await expect(page.getByText('该历史版本与当前文案内容一致，无需重复恢复。')).toBeVisible()
  })

  test('简历管理页可以展示版本历史区块', async ({ page }) => {
    await loginAsRoot(page)
    await page.getByRole('link', { name: '简历管理' }).click()

    await expect(page.getByRole('heading', { name: '简历管理' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '版本历史' })).toBeVisible()
    await expect(page.getByText(/与当前简历结构一致|与当前简历有差异/).first()).toBeVisible()
  })

  test('项目管理页可以展示排序边界提示', async ({ page }) => {
    await loginAsRoot(page)
    await page.getByRole('link', { name: '项目管理' }).click()

    await expect(page.getByRole('heading', { name: '项目管理' })).toBeVisible()
    await expect(page.getByText('当前已经是第一项，不能继续上移。')).toBeVisible()
    await expect(page.getByRole('button', { name: '上移' }).first()).toBeDisabled()
  })
})
