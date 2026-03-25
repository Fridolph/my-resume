# M3-issue-12-web-公开读取已发布版本

## 标题

- Issue：`#17`
- 里程碑：`M3 简历内容与发布流`
- 分支：`feat/m3-issue-12-web-published-read`
- 日期：`2026-03-25`

## 背景

`issue-11` 已经在 `apps/server` 中完成了最小草稿 / 发布闭环。接下来需要有一个真正的公开展示端来验证：公开站只读取已发布内容，而不是直接读取后台草稿。

## 本次目标

- 创建 `apps/web` 最小 `Next.js App Router` 展示壳。
- 只读取 `apps/server` 的已发布简历内容。
- 支持最小 `zh/en` 语言切换。
- 在展示层顺手落下最小 `light / dark` 主题切换钩子。

## 非目标

- 不做复杂视觉设计。
- 不做模板切换。
- 不做后台编辑能力。
- 不在 `Next Route Handlers` 中承载业务逻辑。

## TDD / 测试设计

- 先用 `published-resume-api.spec.ts` 锁定公开读取接口行为：
  - `200` 返回已发布快照
  - `404` 返回空状态
- 先用 `published-resume-shell.spec.tsx` 锁定展示壳行为：
  - 默认显示中文
  - 能切换到英文
  - 能切换 `light / dark`
  - 无已发布内容时显示空状态

## 实际改动

- 新建 `apps/web` 最小 `Next.js` 工程：
  - `package.json`
  - `tsconfig.json`
  - `next.config.ts`
  - `vitest` 配置
- 新建公开展示页面骨架：
  - `apps/web/app/layout.tsx`
  - `apps/web/app/page.tsx`
  - `apps/web/app/globals.css`
- 新建公开简历读取能力：
  - `apps/web/lib/published-resume-api.ts`
  - `apps/web/lib/published-resume-types.ts`
  - `apps/web/lib/env.ts`
- 新建展示壳组件：
  - `apps/web/components/published-resume-shell.tsx`
- 新建测试：
  - `apps/web/lib/published-resume-api.spec.ts`
  - `apps/web/components/published-resume-shell.spec.tsx`
- 更新 `apps/web/README.md`
  - 说明当前职责、主题切换和 API 地址环境变量

## Review 记录

- 是否符合当前 Issue 与里程碑目标：符合。
  - 当前只做公开只读壳，没有扩展到模板系统和复杂视觉。
- 是否存在可抽离的公共能力：有。
  - `published-resume-api` 后续可逐步合并到共享 `api-client`。
  - 主题切换当前先留在页面壳内部，后续可抽到 `packages/ui`。
- 是否存在范围膨胀：可控。
  - 本轮顺带补了 `light / dark` 最小切换，但没有进入模板切换和设计系统重构。

## 自测结果

- `apps/web` 单测：通过
  - `pnpm --filter @my-resume/web test`
- `apps/web` 类型检查：通过
  - `pnpm --filter @my-resume/web typecheck`
- `apps/web` 构建：通过
  - `pnpm --filter @my-resume/web build`
- 真实联调验证：通过
  - 使用本地 `apps/server` 已发布内容
  - 使用 `RESUME_API_BASE_URL=http://127.0.0.1:6789`
  - 实际抓取 `web` 页面 HTML，确认包含“付寅生 / 全栈开发工程师 / 个人简历 Monorepo / 公开简历”等已发布内容

## 遇到的问题

- 问题：你本地 `apps/server` 实际监听端口不是默认 `3001`，而是环境变量驱动的 `6789`。
- 解决方式：`apps/web/lib/env.ts` 增加 `RESUME_API_BASE_URL` 优先级，避免服务端渲染阶段被固定到默认地址。

## 可沉淀为教程/博客的点

- 为什么公开展示端应该只读已发布内容，而不是直接读取草稿。
- `Next.js App Router` 如何只做展示壳，不承接业务逻辑。
- 为什么展示型项目在最小壳阶段就要预留 `light / dark` 和模板扩展钩子。

## 后续待办

- `M3` 内容主线已经收口，可以开始回看里程碑是否需要补一份教程大纲。
- 后续继续进入 `M4 / M5 / M6`，或按需要先补 `packages/ui` / `api-client` 共享抽象。
