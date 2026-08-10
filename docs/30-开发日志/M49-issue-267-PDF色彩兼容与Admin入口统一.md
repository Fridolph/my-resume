# M49 / issue-267 PDF 色彩兼容与 Admin 下载入口统一

- Issue：`#267`
- 日期：`2026-07-06`
- 范围：`apps/web` PDF 导出 hook、`apps/admin` 发布页下载入口

## 背景

`review-resume` 页面已经能按发布态简历渲染 A4 预览，但点击「下载 PDF」后页面卡住，没有实际下载。浏览器控制台定位到 `html2canvas` 在解析 Tailwind v4 / HeroUI 生成的现代色彩函数时失败，典型报错为：

```text
Attempting to parse an unsupported color function "lab"
```

同时，Admin 发布页仍保留独立的 PDF 下载入口。为了避免后台和公开站维护两套 PDF 渲染逻辑，本轮将 Admin PDF 入口统一跳转到公开站 `review-resume` 预览页，由同一套 `html2pdf.js` 流程生成下载。

## 本次目标

- 修复 `html2canvas` 不支持 `lab()` / `oklch()` / `lch()` / `color-mix()` 导致 PDF 下载卡住的问题。
- 强化图片加载等待、失败恢复和 `html2pdf` 临时 DOM 清理。
- Admin 端 PDF 下载入口改为打开公开站 PDF 预览页。
- 补齐 Web / Admin 单元测试与类型检查。

## 非目标

- 不重做服务端 Puppeteer PDF。
- 不删除现有 `/api/resume/published/export/pdf` 兼容接口。
- 不做 PDF 视觉重设计或复杂分页重构。
- 不新增 npm 依赖。

## 实际改动

### Web PDF 导出

- `useResumePdfExport` 增加 `resolveHtml2PdfFactory`，兼容 `html2pdf.js` 在 ESM / CommonJS 下的动态导入形态。
- 图片等待改为 `decode()` 优先，并增加 3 秒超时兜底，避免图片异常导致导出永久阻塞。
- 在 `html2canvas.onclone` 中递归净化 `.review-resume-page` 内的现代色彩函数：
  - 将 `color / backgroundColor / border*Color / fill / stroke / outlineColor / textDecorationColor` 等属性替换为安全 fallback。
  - 对包含现代色彩函数的 `boxShadow / textShadow / filter` 降级为 `none`。
  - 同步处理 SVG `fill / stroke` attribute。
- 导出成功或失败后清理 `.html2pdf__container` 与 `.html2canvas-container`，避免失败后残留克隆 DOM。

### Admin 下载入口

- `DEFAULT_PUBLIC_SITE_BASE_URL` 新增 `NEXT_PUBLIC_WEB_BASE_URL` 配置兜底，本地默认为 `http://localhost:5555`。
- `ExportEntryPanel` 的 Markdown 下载仍走后端导出接口。
- `ExportEntryPanel` 的 PDF 下载改为打开 `/${locale}/review-resume?locale=${locale}`。
- 增加本地和线上域名推导：
  - `:5566` 推导到 `:5555`。
  - `admin-resume.*` 推导到 `resume.*`。
  - `admin.*` 推导到去掉 `admin.` 后的公开站域名。
- 后台文案更新为：PDF 会打开公开站预览页，由浏览器生成并下载。

## Review 记录

- 改动范围仍限定在 PDF 下载修复与 Admin 入口统一，没有触碰服务端 PDF 接口。
- 未新增依赖，继续使用现有 `html2pdf.js`。
- 失败路径会恢复按钮状态并保留错误提示，不再出现导出失败后页面不可继续操作的问题。
- Admin 端不复制 PDF DOM，降低后续维护分叉风险。

## 自测结果

- `/Users/fri/Library/pnpm/.tools/pnpm/10.8.0/bin/pnpm --dir apps/web exec vitest run 'app/[locale]/review-resume/__tests__/review-resume-page.spec.tsx' app/_shared/resume/__tests__/use-resume-pdf-export.spec.ts`
  - 结果：通过，`2 files / 9 tests passed`。
- `/Users/fri/Library/pnpm/.tools/pnpm/10.8.0/bin/pnpm --dir apps/admin exec vitest run 'app/[locale]/dashboard/publish/_publish/__tests__/export-entry-panel.spec.tsx' app/_core/__tests__/env.spec.ts`
  - 结果：通过，`2 files / 8 tests passed`。
- `/Users/fri/Library/pnpm/.tools/pnpm/10.8.0/bin/pnpm --filter @my-resume/web typecheck`
  - 结果：通过。
- `/Users/fri/Library/pnpm/.tools/pnpm/10.8.0/bin/pnpm --filter @my-resume/admin typecheck`
  - 结果：通过。
- `/Users/fri/Library/pnpm/.tools/pnpm/10.8.0/bin/pnpm check:tsx-types`
  - 结果：通过。
- `git diff --check`
  - 结果：通过。

## 手动验证

- 打开 `http://localhost:5555/zh/review-resume?locale=zh`。
- 点击「下载 PDF」后不再出现 `unsupported color function "lab"`。
- 浏览器控制台导出后记录：`Errors: 0, Warnings: 0`。
- 控制台记录已保存到 `.playwright-mcp/review-resume-after-fix-console.log`。

## 遇到的问题与处理

### 1. `html2canvas` 不支持现代 CSS 色彩函数

- 问题：Tailwind v4 / HeroUI 会产生 `lab()`、`oklch()` 等现代颜色，`html2canvas` 当前解析失败。
- 处理：在克隆 DOM 中做导出专用降级，不影响真实页面显示。

### 2. 图片等待可能导致导出卡住

- 问题：图片加载失败或跨域异常时，导出前等待可能长期不返回。
- 处理：增加 `decode()` fallback 与超时兜底，图片失败不阻塞 PDF 生成。

### 3. Admin PDF 入口与公开站入口分叉

- 问题：后台如果单独导出 PDF，后续会维护两套模板与兼容逻辑。
- 处理：后台只负责跳转公开站预览页，下载逻辑统一收敛到 Web。

## 后续可优化

- 如果后续需要更高保真色彩，可单独研究 html2canvas 升级或导出专用 CSS 主题。
- 如果图片跨域在生产环境仍有缺失，可补图片代理或静态化方案。
- 若要确认真实文件下载结果，可在 Playwright E2E 中增加 download event 断言。
