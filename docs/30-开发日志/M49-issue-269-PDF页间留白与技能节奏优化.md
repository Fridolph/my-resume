# M49 / issue-269 PDF 页间留白与技能节奏优化

> 日期：2026-08-10
> Issue：#269 `M49.3 / PDF 页间留白与技能小标题节奏优化`

## 背景

服务端 PDF 已恢复真实导出，但 `@page` 使用零边距，跨页后的正文会紧贴页面顶部和底部。专业技能中的相邻能力组也没有明确的垂直节奏，阅读时标题容易贴近上一段正文。

## 本次改动

- 服务端 PDF 模板的 A4 页面改为 `10mm 0` 上下边距，让自然分页的续页保留稳定留白。
- 相邻 `.skills-item` 增加 `12px` 上边距，区分“前端核心能力 / 全栈开发能力 / AI Agent 开发”等能力小标题。
- 浏览器打印预览的 `review-resume.css` 使用相同的 A4 边距；前端技能组也同步增加条目间距，避免两种预览模式样式漂移。

## Review

- 只涉及 PDF 与打印版式，不改变数据、导出 API、分页算法或内容长度。
- 没有增加依赖或调整 Docker/环境配置。
- 页边距会压缩每页可用高度；当前实际简历仍保持 4 页。

## 验证

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/resume/__tests__/resume-pdf-export.service.spec.ts src/modules/resume/__tests__/resume.controller.spec.ts`
  - 通过：2 个文件、7 个测试。
- `pnpm --dir apps/web exec vitest run 'app/[locale]/review-resume/__tests__/review-resume-page.spec.tsx'`
  - 通过：5 个测试。
- `pnpm --filter @my-resume/server typecheck`、`pnpm --filter @my-resume/web typecheck`、`git diff --check`
  - 通过。
- 本地 API 重新导出 PDF：A4、4 页；用 `pdftoppm` 渲染 PNG 后确认跨页留白与技能小标题间距正常。

## 后续切入点

- 若未来简历内容继续增长，可考虑把技能关键词按更细的语义块拆分，进一步控制单页密度。
