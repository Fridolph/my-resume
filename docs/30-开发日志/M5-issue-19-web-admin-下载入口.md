# M5 / issue-19 web-admin 下载入口

- Issue：`#26`
- 里程碑：`M5 导出与下载：Markdown / PDF`
- 分支：`feat/m5-issue-19-download-entry`
- 日期：`2026-03-25`

## 背景

当 Markdown 和 PDF 导出链路都已经由 `apps/server` 提供后，用户还缺少最直观的使用入口。  
因此 M5 最后一轮要在 `web` 和 `admin` 两个前端表面都把下载入口接出来。

这一轮仍然保持最小边界：

- `web` 提供公开已发布版本下载
- `admin` 提供后台壳内的下载入口说明与链接
- 不引入下载历史、任务管理或复杂导出中心

## 本次目标

- 在 `apps/web` 接入 Markdown / PDF 下载入口
- 在 `apps/admin` 接入 Markdown / PDF 下载入口
- 保持公开端与后台端的边界说明清晰
- 补齐最小前端测试

## 非目标

- 不做导出历史列表
- 不做下载管理中心
- 不做后台草稿导出
- 不做多模板下载切换

## TDD / 测试设计

### `apps/web`

在 `published-resume-shell.spec.tsx` 中补充：

- 默认中文态能看到 Markdown / PDF 下载链接
- 切换到 `EN` 后链接中的 `locale` 会同步变为 `en`

### `apps/admin`

新增 `export-entry-panel.spec.tsx`，锁定：

- 后台可看到 Markdown / PDF 下载链接
- `viewer` 会看到只读说明
- `admin` 会看到后台下载说明

## 首次失败记录

### 1. web 公开下载链接不存在

- `pnpm --filter @my-resume/web test -- --run components/published-resume-shell.spec.tsx`
- 结果：失败
- 原因：页面中还没有导出链接

### 2. admin 下载入口组件不存在

- `pnpm exec vitest run components/export-entry-panel.spec.tsx`
- 结果：失败
- 原因：缺少 `ExportEntryPanel`

## 实际改动

### `apps/web`

- `PublishedResumeShell` 新增导出链接
- 支持根据当前语言状态生成：
  - `/resume/published/export/markdown?locale={locale}`
  - `/resume/published/export/pdf?locale={locale}`
- `app/page.tsx` 显式把 `apiBaseUrl` 传入公开壳

### `apps/admin`

- 新增 `ExportEntryPanel`
- 在 `AdminDashboardShell` 中接入后台下载入口
- 对 `admin / viewer` 分别展示不同说明文案：
  - `admin`：可继续推进发布与 AI 流程
  - `viewer`：只能读取已发布导出结果，不能触发新生成

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只补了前端下载入口：

- server 导出逻辑未被扩散到前端
- web/admin 都已拥有各自入口
- 权限边界通过文案与入口语义保持清晰

### 是否存在可继续抽离的点

当前保持最小合理拆分：

- `PublishedResumeShell` 内直接维护公开下载链接
- `ExportEntryPanel` 独立承接后台下载入口
- 后续若 `web / admin` 下载入口继续变复杂，可再抽共享 util 或共享组件

### Review 结论

- 通过
- M5 的导出闭环已经具备

## 自测结果

### 1. web 组件测试

- `pnpm --filter @my-resume/web test -- --run components/published-resume-shell.spec.tsx`
- 结果：通过

### 2. admin 组件测试

- `pnpm exec vitest run components/export-entry-panel.spec.tsx`
- 结果：通过

### 3. web / admin 类型检查

- `pnpm --filter @my-resume/web typecheck`
- 结果：通过
- `pnpm --filter @my-resume/admin typecheck`
- 结果：通过

## 遇到的问题

### 1. admin 的 `pnpm test -- --run ...` 会把旧测试一起拉起来

- 风险：容易把无关历史问题误算到当前 issue 范围里
- 处理：本轮改用 `pnpm exec vitest run <file>` 精确验证新入口组件

### 2. 下载入口放在后台不等于后台就能导出草稿

- 风险：读者可能误解成“后台下载 = 草稿下载”
- 处理：当前通过文案明确说明：仍然只导出已发布版本

## 可沉淀为教程 / 博客的点

- 为什么前端下载入口应该复用服务端导出接口，而不是自己拼内容
- `web` 与 `admin` 的下载入口为什么语义不同
- 如何在教程型项目里用最小组件测试锁定下载链接行为
- 为什么后台入口不等于后台草稿导出

## 后续待办

- 关闭 `issue-19`
- 关闭 `M5` 里程碑
- 补一篇 `M5` 教程 / 博客大纲
