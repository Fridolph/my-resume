# M12 / issue-136 开发日志：web HeroUI 公开站重构与 AI Talk 入口占位

- Issue：`#136`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/feat-m12-issue-136-web-heroui-public-site-upgrade`
- 日期：`2026-04-03`

## 背景

`apps/web` 已经能读取并展示公开简历，但整体仍停留在“单页壳 + 模块堆叠”的状态。

这对于当前教程型阶段是够用的，但如果继续往“开源版可展示、可上线、可继续承接 RAG 能力”的方向推进，公开站至少要回答三个问题：

- 首页到底应该先让访问者看到什么
- 哪些内容是“直接简历阅读流”，哪些内容更适合做 profile / about 补充页
- 后续 RAG 问答入口应该在哪里预留，而不是等功能做完再硬塞进站点结构

因此这轮不是只换样式，而是顺带把公开站的信息架构立住。

## 本次目标

- 为 `apps/web` 引入 `Tailwind CSS v4 + HeroUI` 基线
- 把首页调整为“直接阅读公开简历”的主页面
- 把统计与补充背景内容收进 `/profile`
- 新增 `/ai-talk` 占位页，为后续 RAG 个人知识库问答预留入口
- 保持现有公开简历读取、主题切换、语言切换与导出链路可用

## 非目标

- 不改 `apps/server` API 契约
- 不在这轮真正实现 RAG 问答能力
- 不扩展 admin 端新功能
- 不进入 Figma 精修或商业版模板系统

## 实际改动

### 1. 为 web 建立 HeroUI + Tailwind v4 基线

更新：

- `apps/web/package.json`
- `apps/web/postcss.config.mjs`
- `apps/web/app/globals.css`
- `pnpm-lock.yaml`

这轮把 web 端的样式基线和 admin 对齐到同一代技术栈，避免后续继续在“旧 CSS 体系”上做视觉升级。

但为了控制教学范围，主题状态暂时继续复用 `@my-resume/ui/theme`，没有把 web 也同步扩成 `next-themes` 版本。

### 2. 首页改成“直接阅读简历”的公开页

更新：

- `apps/web/components/published-resume-shell.tsx`
- `apps/web/components/published-resume/published-resume-hero.tsx`
- `apps/web/components/published-resume/published-resume-section-card.tsx`
- `apps/web/components/published-resume/published-resume-empty-state.tsx`

这轮把首页主阅读流明确收成：

- 顶部公共导航
- hero 区直接展示姓名、标题、摘要、联系方式、导出动作
- 下方继续按经历 / 项目 / 教育 / 技能 / 亮点组织公开简历内容

之前会打断阅读节奏的统计卡片不再出现在首页主路径里。

### 3. 新增 `/profile` 页面承接统计与补充背景

新增：

- `apps/web/app/profile/page.tsx`
- `apps/web/components/profile-overview-shell.tsx`

这里承接：

- 履历信号统计
- 候选人补充背景
- 公开链接
- 进入 AI Talk 的入口

这样首页和 profile 的职责就更清楚了：

- 首页负责“看简历”
- profile 负责“补背景和信号”

### 4. 新增 `/ai-talk` 占位页

新增：

- `apps/web/app/ai-talk/page.tsx`
- `apps/web/components/ai-talk-placeholder-shell.tsx`

当前页只做三件事：

- 给站点结构预留入口
- 说明后续会如何接入 RAG
- 给出未来可回答的问题方向

这样后续做个人知识库问答时，不需要再反过来重构公开站导航。

### 5. 补齐导航与测试

新增或更新：

- `apps/web/components/public-site-header.tsx`
- `apps/web/components/__tests__/published-resume-shell.spec.tsx`
- `apps/web/components/__tests__/profile-overview-shell.spec.tsx`
- `apps/web/components/__tests__/ai-talk-placeholder-shell.spec.tsx`
- `apps/web/components/__tests__/resume-published-fixture.ts`

本轮测试重点放在：

- 首页信息架构是否切换完成
- profile 与 ai-talk 路由入口是否存在
- 主题与语言切换是否继续工作
- 导出链接是否仍随语言切换正确变化

## Review 记录

### 是否符合当前 issue 目标

符合。

这轮只围绕公开站的信息架构、视觉基线和后续 AI Talk 入口预留展开，没有继续扩到 server 业务或真正的 RAG 问答实现。

### 是否有进一步可抽离的空间

有，但当前不继续做：

- `public-site-header` 后续可以继续抽成更稳定的站点级壳组件
- profile 信号卡片与部分展示区块后续可继续沉淀到 `packages/ui`
- 如果 web 与 admin 的 HeroUI 模式趋于稳定，可再判断是否统一共享主题和部分展示组件

当前优先级仍然是先把“公开站结构成立”这条主线收住。

## 自测结果

已执行：

- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/web build`

结果：

- 类型检查通过
- 单元测试通过
- 构建通过

## 后续可继续沉淀为教程的点

- 为什么公开站首页应该优先让招聘方直接进入简历阅读流
- 为什么统计与信号更适合作为 profile / about 补充页，而不是塞进首页主路径
- 为什么 AI Talk 在真正接 RAG 之前，也值得先把站点入口和产品语义立住
