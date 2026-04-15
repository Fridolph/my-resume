# M7 / issue-34 开发日志：展示层整理，为后续 UI 升级预留边界

- Issue：#55
- 里程碑：M7 展示层与内容接入：从联调壳到真实页面
- 分支：`feat/m7-issue-34-display-boundary`
- 日期：2026-03-25

## 背景

在 `issue-33` 完成后，`web` 已经具备模块化公开简历页面，而 `admin` 也已经有了最小控制台和草稿编辑面板。这时再往下做 UI 升级时，一个明显风险就出现了：

- `web / admin` 都各自维护一套基础展示层 tokens
- 字体、背景、阴影、卡片半径、弱文案与 eyebrow 规则存在重复
- 如果继续各写各的，后续再抽 `packages/ui` 会更痛苦

所以这一步不做组件库，只做最小必要的共享展示层整理。

## 本次目标

- 识别 `web / admin` 已经重复的展示层基础表达
- 抽出最小共享 CSS tokens 与基础样式
- 初始化 `packages/ui` 的可继续扩展边界
- 不影响现有功能闭环与测试结果

## 非目标

- 不建设完整设计系统
- 不把现有 React 组件迁进 `packages/ui`
- 不大规模重命名页面类名
- 不做多模板或主题系统重构

## TDD / 测试设计

本次属于展示层整理，重点不在新增交互，而在“共享样式引入后仍然稳定可构建、可测试”。因此验证方式以类型、构建和现有组件测试为主：

- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web build`
- `pnpm --filter @my-resume/web test`

## 实际改动

### 1. 初始化 `packages/ui` 的最小包边界

新增：

- `packages/ui/package.json`
- `packages/ui/src/display.css`

这里没有急着塞 React 组件，而是先把真正已经重复出现的展示层基础能力抽出来：

- 字体栈
- 页面背景与渐变光晕
- surface / muted surface / border / accent 等 tokens
- card radius、control radius、pill radius
- 共享阴影
- `eyebrow`、`muted`、基础 surface class 等最小样式

这类内容最适合先共享，因为它们已经在 `web / admin` 形成重复，但还没有抽象到必须用组件承载的程度。

### 2. `admin` / `web` 改为消费共享展示 tokens

更新：

- `apps/admin/app/globals.css`
- `apps/web/app/globals.css`

两端现在都通过 `@import '../../../packages/ui/src/display.css';` 引入共享展示层基础样式。

同时：

- `admin` 保留自己的表单、状态框、信息栅格等业务样式
- `web` 保留自己的 hero、timeline、tag-grid 等简历展示样式
- 共享层只承接基础 tokens 和基础表达，不越界侵入业务布局

这正是本次 issue 的边界：先抽“共同基础”，不抽“业务组件”。

### 3. 更新 `packages/ui` 文档职责说明

更新：

- `packages/ui/README.md`

README 现在明确了当前已经落地的内容和未来职责，避免 `packages/ui` 继续停留在纯占位状态，也避免后续协作时误以为这里已经是完整组件库。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次确实只做了“共享展示 tokens + 基础样式整理”，没有扩展到：

- 抽出完整 React 组件库
- 重构 `admin / web` 页面结构
- 多模板与主题系统设计
- 设计系统文档站建设

### 是否可抽离组件、公共函数、skills 或其他复用能力

本次抽离结论是：

- 值得先抽的是 **tokens 和基础样式**
- 暂时不值得抽的是 **业务层 React 组件**

因为当前 `web` 和 `admin` 虽然都在展示内容，但页面职责完全不同：

- `web` 偏公开展示
- `admin` 偏后台操作与编辑

如果现在就强行抽通用组件，往往会把差异也一起抽糊掉，反而增加未来维护成本。

### 什么时候该抽，什么时候不该过早抽

这次的结论很明确：

- **已经重复出现、而且语义稳定的基础表达**，应该抽
- **仍然高度依赖具体页面语境的业务组件**，先不要抽

因此 `display.css` 是合理抽象，`ResumeDraftEditorPanel` / `PublishedResumeHero` 这类组件现在还不适合进入共享层。

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web build`
- `pnpm --filter @my-resume/web test`

结果：全部通过。

补充说明：构建时仍有现存 Tailwind `content` 配置告警，但与本次共享 CSS 抽离无直接冲突；当前不影响功能和构建，后续如进入样式基建整治再单独处理。

## 遇到的问题

### 1. 共享层容易一步走到“组件库”

问题：一旦开始抽展示层，最容易做过头，直接把业务组件也一起抽进共享包。

处理：

- 本次只抽 tokens 与基础样式
- 保持业务组件仍然留在各自 app 中
- 把共享层边界先收敛到“稳定、低风险、已重复”的那部分

### 2. `web` 和 `admin` 的视觉诉求并不相同

问题：虽然两端都在使用卡片、文案、弱文案等基础表达，但布局和业务语义不同。

处理：

- 共享基础 tokens
- 保留各端自己的布局类和业务样式
- 避免抽象层次过深导致样式耦合

## 可沉淀为教程/博客的点

- 什么样的展示层重复，值得先抽成共享 tokens
- 为什么教程型项目里，先抽基础样式比先抽组件库更合适
- 如何判断“抽象时机”而不是一看到重复就立刻组件化

## 后续待办

- 整理 M7 里程碑教程大纲
- 关闭 `M7` 里程碑并回顾当前可交付基线
