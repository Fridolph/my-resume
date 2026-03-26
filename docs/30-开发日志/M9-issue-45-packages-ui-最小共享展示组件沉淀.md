# M9 / issue-45 开发日志：packages/ui 最小共享展示组件沉淀

- Issue：#79
- 里程碑：M9 体验基线与主题边界：从可用到可继续设计
- 分支：`fys-dev/feat-m9-issue-45-shared-display-primitives`
- 日期：2026-03-26

## 背景

前面的几个 M9 任务已经把两端页面逐步拉出了“纯验证页”状态：

- `issue-42` 建立了共享主题基线
- `issue-43` 梳理了后台仪表盘壳
- `issue-44` 升级了公开简历页的视觉基线

但随着 `admin / web` 都开始承载更完整的展示结构，重复也开始出现：

- 两端都有“表面卡片”容器
- 两端都有“题眉 + 标题 + 说明”的标题块
- 两端都有“标签 / 状态 / 指标卡”这类展示结构

如果继续在各自页面里复制这些结构，后续再做样式升级、模板化或主题化时，会很难判断哪些应该共享、哪些应该继续留在业务层。

## 本次目标

- 在 `packages/ui` 沉淀最小共享展示原语
- 优先解决 `web / admin` 都在重复的展示结构
- 保持共享层轻量、通用、易教学
- 让两端页面代码更聚焦于业务表达，而不是重复写壳结构

## 非目标

- 不做完整组件库
- 不引入新的业务逻辑或数据请求抽象
- 不把所有页面组件都搬进 `packages/ui`
- 不改动 `apps/server` 接口和数据契约

## TDD / 测试设计

### 1. 先为共享展示原语补测试

新增：

- `packages/ui/src/display.spec.tsx`

先验证以下最小能力：

- `DisplaySurfaceCard` 能以不同语义元素渲染共享表面容器
- `DisplaySectionIntro` 能输出题眉、标题和说明
- `DisplayStatCard` 能输出标签、值和说明
- `DisplayPill` 能按文本或链接两种语义渲染

这样做的目的，是先把共享层的最小行为钉住，再去迁移使用方。

### 2. 使用侧回归测试继续保护

继续执行现有回归：

- `apps/web/components/published-resume-shell.spec.tsx`
- `apps/admin/components/admin-dashboard-shell.spec.tsx`

重点确认：

- 公开页的语言切换、主题切换、导出链接和空状态不回退
- 后台壳的未登录态、概览区、角色提示和占位面板不回退

### 3. 工程级验证

执行：

- `pnpm --filter @my-resume/ui test`
- `pnpm --filter @my-resume/ui typecheck`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web build`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`

## 实际改动

### 1. 在 `packages/ui` 新增四个最小共享展示原语

新增 / 更新：

- `packages/ui/src/display.tsx`
- `packages/ui/src/display.css`
- `packages/ui/src/display.spec.tsx`

本轮沉淀的共享原语是：

- `DisplaySurfaceCard`
- `DisplaySectionIntro`
- `DisplayStatCard`
- `DisplayPill`

它们的定位不是“页面组件”，而是更基础的展示原语：

- `DisplaySurfaceCard` 负责共享的表面容器
- `DisplaySectionIntro` 负责标题块
- `DisplayStatCard` 负责指标或状态卡
- `DisplayPill` 负责标签和链接胶囊

这样既能把重复结构收起来，又不会一下子把业务组件都拉进共享层。

### 2. 把公开简历页接到共享展示层

更新：

- `apps/web/components/published-resume/published-resume-section-card.tsx`
- `apps/web/components/published-resume/published-resume-empty-state.tsx`
- `apps/web/components/published-resume/published-resume-hero.tsx`
- `apps/web/components/published-resume/published-resume-experience-section.tsx`
- `apps/web/components/published-resume/published-resume-projects-section.tsx`
- `apps/web/components/published-resume/published-resume-skills-section.tsx`
- `apps/web/components/published-resume-shell.tsx`
- `apps/web/app/globals.css`

这轮没有把公开页“组件库化”，而是只把明显重复的展示结构切换到共享原语：

- section 卡片改为 `DisplaySurfaceCard + DisplaySectionIntro`
- signal cards 改为 `DisplayStatCard`
- meta / 技术栈 / 外部链接改为 `DisplayPill`
- 空状态也改为共享卡片 + 标题块

这样公开页仍然保留自己的页面语义和布局，但展示骨架开始共用。

### 3. 把后台登录页与仪表盘壳接到共享展示层

更新：

- `apps/admin/components/admin-login-shell.tsx`
- `apps/admin/components/admin-dashboard-shell.tsx`
- `apps/admin/app/globals.css`

后台侧主要切换了这些部分：

- 登录说明卡和未登录态改为共享表面卡片 + 标题块
- 仪表盘 hero 区块改为共享卡片 + 标题块
- 概览卡、会话信息卡改为 `DisplayStatCard`
- 顶部状态标签改为 `DisplayPill`

这让后台壳组件可以更专注于“信息组织、角色边界和动作入口”，而不是重复维护底层展示骨架。

### 4. 同时收掉一部分重复样式

这轮不只是抽 React 组件，也顺手把一部分重复 CSS 收敛回共享层：

- 表面容器边框、阴影、圆角回到 `packages/ui/src/display.css`
- 指标卡的基础视觉回到共享层
- 胶囊链接的基础 hover 效果回到共享层

应用侧 CSS 只保留布局、间距和个别页面特有的视觉调整。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只做：

- `packages/ui` 最小共享展示原语
- `admin / web` 使用侧迁移
- 共享层测试与工程校验

没有越界去做：

- 完整组件库
- 业务状态管理抽象
- 页面级模板系统
- 新的服务端接口或 DTO

### 是否可抽离组件、公共函数、skills 或其他复用能力

本次已经完成当前最合适的一层抽离：展示原语层。

刻意没有继续往上抽：

- `PublishedResumeHero`
- `RoleActionPanel`
- `ResumeDraftEditorPanel`

原因是这些组件仍然有强业务语义，过早放进共享层会让教程和维护都变得更难解释。

### 本次最重要的边界判断

这轮抽的是“原语”，不是“成品组件”。

如果直接把公开页 hero、后台卡片区都整体搬进 `packages/ui`，短期看会更省事，但很快就会让共享层掺进：

- 路由语义
- 权限语义
- 简历业务语义

这和当前教程型仓库的节奏不匹配。

## 自测结果

已执行：

- `pnpm --filter @my-resume/ui test`
- `pnpm --filter @my-resume/ui typecheck`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web build`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`

结果：全部通过。

补充说明：

- `web / admin build` 过程中仍有现存 Tailwind `content` 配置告警，但不是本轮引入的问题，当前不影响构建结果。

## 遇到的问题

### 1. 共享层很容易抽过头

问题：

看到 `web / admin` 都有卡片和标题块后，很容易顺手把更高层的页面结构也一起抽进去。

处理：

- 只抽“展示原语”
- 页面级组件继续留在应用层
- 先解决重复结构，不抢跑模板系统

### 2. 测试通过不代表 TypeScript 测试类型也完整

问题：

`packages/ui` 新增 Testing Library 测试后，Vitest 能跑通，但 `tsc` 一开始还不认识 jest-dom matcher。

处理：

- 为 `packages/ui` 增加 `vitest.setup.ts`
- 在 `tsconfig.json` 中补上 `vitest/globals` 与 `@testing-library/jest-dom` 类型声明

## 可沉淀为教程/博客的点

- 什么时候该抽共享展示原语，什么时候不该直接上组件库
- 为什么共享层更适合先抽 `Surface / Intro / Stat / Pill` 这类基础结构
- 如何让共享样式和页面样式各司其职，而不是互相覆盖
- 如何用 TDD 验证“共享层抽象”而不是只验证页面最终长相

## 后续待办

- 继续推进 `M9 / issue-46`：M9 教程大纲与里程碑收束
- 后续如进入模板化阶段，再判断哪些展示原语需要继续往上组合
- 如果后面 `admin / web` 出现新的稳定重复结构，再新增下一层共享组件
