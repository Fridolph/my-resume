# M49 / issue-266 PDF 预览与 html2pdf 下载收口

- Issue：`#266`
- 日期：`2026-07-06`
- 范围：`apps/web` 公开站 PDF 预览页与下载入口

## 背景

`review-resume` 页面已经有 A4 预览和 `html2pdf.js` 导出雏形，但页面仍按未压平的 `{ zh, en }` 数据读取字段；而当前 `/api/resume/published?locale=zh|en` 返回的是按 locale 压平后的字符串。公开站下载菜单也仍直连后端 PDF 导出，无法先预览再下载。

本轮目标是把公开站 PDF 下载体验收口为：用户从下载菜单进入 A4 预览页，确认内容后在浏览器端生成 PDF。

## 本次目标

- 修正 `review-resume` 页面与发布态接口的真实数据契约。
- 补齐加载态、错误态、无发布态和导出中状态。
- 强化 `html2pdf.js` 导出配置，等待图片加载，并加入 A4/pagebreak 配置。
- 桌面端与移动端 PDF 下载入口改为预览页。
- 增加单元测试，覆盖渲染、导出与入口切换。

## 非目标

- 不新增公开 API。
- 不删除或重做服务端 Puppeteer PDF 导出。
- 不改简历数据模型。
- 不复刻公开站卡片视觉，PDF 目标是正式 A4 简历预览。

## 实际改动

### Web 预览页

- `review-resume.types.ts` 改为 locale 压平后的字符串模型。
- `review-resume/page.tsx` 使用 `DEFAULT_API_BASE_URL + joinApiUrl` 请求 `/api/resume/published?locale=...`，避免线上继续依赖 `localhost` 端口替换逻辑。
- locale 解析改为 `?locale=` 优先，路由 locale 兜底。
- 增加加载、错误、空发布态和导出错误提示。

### PDF 导出

- `useResumePdfExport` 增加：
  - 图片等待。
  - A4 portrait / mm 单位配置。
  - `pagebreak` 避免 section / avoid-break / pdf-keep 被切断。
  - `html2canvas` 白底、CORS、scale、scroll 固定。
  - Tailwind v4 `oklch/lab` 颜色兼容处理。

### 入口与样式

- 公开站桌面和移动下载菜单中，Markdown 继续走后端导出；PDF 改为 `/${locale}/review-resume?locale=${locale}`。
- `review-resume.css` 增加 A4、打印、分页、移动横向预览和禁用动画样式。

## Review 记录

- 改动范围符合 issue：只涉及 `apps/web` PDF 预览/入口、测试和开发日志。
- 未新增 npm 依赖，复用已有 `html2pdf.js`。
- 未改服务端 API 或数据模型。
- 保留服务端 PDF 导出作为兼容入口，不影响旧接口。
- 已补测试覆盖主要用户路径和导出 hook 配置。

## 自测结果

- `pnpm --dir apps/web exec vitest run 'app/[locale]/review-resume/__tests__/review-resume-page.spec.tsx' app/_shared/resume/__tests__/use-resume-pdf-export.spec.ts 'app/[locale]/_resume/__tests__/shell.spec.tsx'`
  - 结果：通过，17 tests passed。
- `pnpm --filter @my-resume/web typecheck`
  - 结果：通过。
- `pnpm check:tsx-types`
  - 结果：通过。
- `git diff --check`
  - 结果：通过。
- `pnpm --filter @my-resume/web build`
  - 结果：通过，`/[locale]/review-resume` 已生成 zh/en 静态路由。
- `pnpm --dir apps/web exec oxlint --config ../../.oxlintrc.json --ignore-path ../../.eslintignore 'app/[locale]/review-resume/page.tsx' 'app/[locale]/review-resume/review-resume.types.ts' app/_shared/resume/use-resume-pdf-export.ts app/_shared/site/public-site-header-actions.tsx app/_shared/site/public-site-header-mobile-menu.tsx 'app/[locale]/_resume/__tests__/shell.spec.tsx' 'app/[locale]/review-resume/__tests__/review-resume-page.spec.tsx' app/_shared/resume/__tests__/use-resume-pdf-export.spec.ts`
  - 结果：通过，0 warnings / 0 errors。
- `pnpm --filter @my-resume/web lint`
  - 结果：未通过，但失败项均为本轮未触达的既有问题，集中在 `ai-chat` 与旧 resume shell 的 hooks/a11y/no-shadow 规则；本轮 touched files 的定向 lint 已通过。

## 遇到的问题与处理

### 1. 页面数据契约与接口真实响应不一致

- 问题：页面按 `{ zh, en }` 读取，但接口按 locale 返回字符串。
- 处理：将 `review-resume` 内部类型改为压平字符串模型，保留轻量 `t()` 包装降低组件改动面。

### 2. 本地 API 推断不适合线上

- 问题：原逻辑用 `window.location.origin.replace(':5555', ':5577')` 拼 API，只适合本地。
- 处理：复用 `DEFAULT_API_BASE_URL` 与 `joinApiUrl`。

### 3. PDF 导出需要等待图片和控制分页

- 问题：头像等图片未加载完成时可能丢失，section 也可能被切断。
- 处理：导出前等待图片；增加 `pagebreak` 与 CSS avoid-break 规则。

## 后续可优化

- 若跨域头像在 html2canvas 中仍受 CORS 限制，可单开图片代理或静态化 issue。
- 后续可考虑把客户端 PDF 预览页与服务端 Puppeteer PDF 模板抽出一份共享的 section 配置，减少长期样式漂移。
- 若需要更精细分页，可引入显式 page container 或手动分页策略。
