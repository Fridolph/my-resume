# M12 / issue-134 开发日志：admin HeroUI 后台壳与工作区重构

- Issue：`#134`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/feat-m12-issue-133-and-m13-issue-134-followup`
- 日期：`2026-04-03`

## 背景

`apps/admin` 之前已经能跑通最小登录、简历编辑、AI 工作台和发布导出，但页面组织仍然偏“功能堆叠”，不像一套可以继续扩展的标准后台。

这轮的目标不是继续加新业务，而是把后台壳、导航、登录页和工作区布局真正收成一条清晰主线，让后续读者能看懂：

- 后台为什么要有独立的受保护 layout
- 为什么简历编辑、AI 工作台、发布导出要分成独立工作区
- 为什么主题切换、会话信息和路由入口应该收在统一壳层

## 本次目标

- 用 HeroUI 收住后台登录页与后台工作区结构
- 建立受保护后台壳、集中导航和页面元信息
- 补上 `dashboard/resume` 与 `dashboard/publish` 页面入口
- 让主题切换、会话状态和退出入口进入统一后台 header

## 非目标

- 不新增 server 业务接口
- 不扩展新的 AI 场景
- 不改 web 展示端视觉
- 不升级成 SSR cookie / middleware 鉴权方案

## 实际改动

### 1. 建立后台受保护壳与工作区路由

新增或整理：

- `apps/admin/app/dashboard/layout.tsx`
- `apps/admin/app/dashboard/page.tsx`
- `apps/admin/app/dashboard/resume/page.tsx`
- `apps/admin/app/dashboard/publish/page.tsx`
- `apps/admin/components/admin-protected-layout.tsx`
- `apps/admin/lib/admin-navigation.ts`
- `apps/admin/lib/admin-session.tsx`

让后台具备了统一的：

- 左侧导航
- 顶部页面标题与描述
- 当前用户与角色展示
- 主题切换与退出入口

### 2. 登录页与后台面板统一 HeroUI 风格

更新：

- `apps/admin/components/admin-login-shell.tsx`
- `apps/admin/components/login-form.tsx`
- `apps/admin/components/admin-dashboard-shell.tsx`
- `apps/admin/components/admin-resume-shell.tsx`
- `apps/admin/components/admin-publish-shell.tsx`

处理重点是让后台从“能访问页面”升级为“有标准工作区节奏”的后台。

### 3. 补齐后台样式基线与 HeroUI 配置

更新：

- `apps/admin/app/globals.css`
- `apps/admin/app/layout.tsx`
- `apps/admin/app/providers.tsx`
- `apps/admin/postcss.config.mjs`
- `apps/admin/package.json`
- `.npmrc`

这里的重点不是单纯换组件，而是让 admin 端开始有稳定的样式体系、主题入口和运行依赖。

### 4. 收口相关面板与交互细节

更新：

- `apps/admin/components/resume-draft-editor-panel.tsx`
- `apps/admin/components/role-action-panel.tsx`
- `apps/admin/components/export-entry-panel.tsx`
- `apps/admin/components/theme-mode-toggle.tsx`
- `packages/ui/src/display.tsx`

这些调整的目标是让后台各工作区在同一套视觉和交互节奏下工作，而不是每个面板各写一套。

## Review 记录

### 是否符合当前 issue 目标

符合。

这轮只做后台壳、工作区、登录页和 HeroUI 收口，没有继续新增新的 server 能力。

### 是否有继续抽离的空间

有，但当前不继续做：

- 后台壳的部分展示组件后续可以继续沉淀到 `packages/ui`
- 会话管理后续可以继续升级到更完整的鉴权链路
- 当前先让“后台结构成立”比继续抽象更重要

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin build`

结果：

- 类型检查通过
- 单元测试通过
- 构建通过

## 后续可继续沉淀为教程的点

- 为什么后台重构时，先收“后台壳与工作区”而不是继续扩功能
- 为什么 Next.js admin 更适合先建立统一 protected layout
- HeroUI 在教程型后台项目里的适用边界是什么
