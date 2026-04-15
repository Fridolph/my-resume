# M7 / issue-33 开发日志：web 公开简历页面模块化渲染

- Issue：#54
- 里程碑：M7 展示层与内容接入：从联调壳到真实页面
- 分支：`feat/m7-issue-33-web-modular-render`
- 日期：2026-03-25

## 背景

在 `issue-32` 完成后，公开站已经可以读到真实迁移后的个人简历内容，但页面仍然主要由一个 `PublishedResumeShell` 粗粒度组件承担全部展示职责。只要结构还集中在一个文件里，后续一旦进入 UI 升级、主题整理或模板扩展，就会很快失控。

因此这一步先不追求完整视觉重设计，而是先把公开简历拆成稳定的展示模块，让页面结构先“能维护、能讲清、能继续长”。

## 本次目标

- 将公开简历按模块拆分渲染
- 覆盖 `profile / experiences / projects / education / skills / highlights`
- 保持 `zh / en` 与 `light / dark` 仍然可用
- 为后续展示层整理和 UI 升级保留清晰边界

## 非目标

- 不接 Figma 精修稿
- 不做多模板切换
- 不进入完整视觉重设计
- 不在本次跨到 `packages/ui` 做共享设计系统

## TDD / 测试设计

本次重点不在接口，而在页面结构稳定性，因此测试放在 `PublishedResumeShell` 组件行为上：

- 默认中文能展示模块化 section
- 切到英文后，各 section 标题和内容同步切换
- `light / dark` 主题切换仍影响 `documentElement`
- 导出链接仍会随语言切换更新参数
- 未发布时的空态不受影响

对应执行：

- `pnpm --filter @my-resume/web test -- published-resume-shell.spec.tsx`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web build`

## 实际改动

### 1. 将公开页拆成模块组件

新增目录：

- `apps/web/components/published-resume/`

新增组件：

- `published-resume-empty-state.tsx`
- `published-resume-hero.tsx`
- `published-resume-section-card.tsx`
- `published-resume-experience-section.tsx`
- `published-resume-projects-section.tsx`
- `published-resume-education-section.tsx`
- `published-resume-skills-section.tsx`
- `published-resume-highlights-section.tsx`
- `published-resume-utils.ts`

这样拆分后，每个模块只关注自己的展示职责，而 `PublishedResumeShell` 只负责：

- 已发布 / 空态判断
- 语言切换状态
- 主题切换状态
- 页面整体编排

### 2. 公开页开始完整消费标准模型模块

更新后的页面不再只展示项目和技能，而是正式接入：

- `profile`：hero 区域与基础信息
- `experiences`：工作经历模块
- `projects`：项目经历模块
- `education`：教育模块
- `skills`：技能模块
- `highlights`：亮点模块

这一步非常关键，因为它意味着 `web` 首次以“完整标准简历”的视角组织页面，而不是零散读取部分字段。

### 3. 保留主题与模板扩展钩子

更新：

- `apps/web/components/published-resume-shell.tsx`
- `apps/web/app/globals.css`

本次保留了：

- `light / dark` 主题切换
- `data-template="standard"` 作为标准模板标识
- 模块级 `section-card / section-stack / content-grid` 布局边界

这意味着后续要做视觉升级时，可以在当前模块结构上演进，而不需要重新从单文件大组件中硬拆。

### 4. 更新模块化测试断言

更新：

- `apps/web/components/published-resume-shell.spec.tsx`

测试不再只验证 hero 与导出链接，而是新增断言：

- 职业经历 / 代表项目 / 教育背景 / 技能结构 / 补充亮点
- 中英文切换后的 section 标题同步

这样可以保证“模块化”不是主观感觉，而是有自动化断言兜底。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次专注于 `apps/web` 的模块化渲染，没有扩展到：

- admin 展示层共性整理
- packages/ui 共享设计系统
- 视觉精修与品牌化表达
- 多模板切换机制

### 是否可抽离组件、公共函数、skills 或其他复用能力

已做的最小抽离：

- section 基础卡片：`published-resume-section-card.tsx`
- 展示层工具：`published-resume-utils.ts`
- 各模块单独组件化

但当前仍然只在 `apps/web` 内部抽离，没有直接升级为跨应用共享能力。这是有意控制范围：本次先让“模块边界”成立，下一步再做“共享边界”整理。

### 为什么现在先模块化，而不是直接重设计

因为视觉稿可以反复调整，但页面结构一旦混乱，后续每次改版都会成本很高。

先模块化的价值在于：

- 先把领域内容和显示边界对齐
- 先让测试知道“页面有哪些稳定模块”
- 再进入样式升级时，改动范围更可控

这比直接重设计更适合教程型项目的节奏。

## 自测结果

已执行：

- `pnpm --filter @my-resume/web test -- published-resume-shell.spec.tsx`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web build`

结果：全部通过。

补充说明：构建时仍出现现有 Tailwind `content` 配置告警，但不影响本次构建与功能闭环；该问题会在后续展示层整理中一并考虑。

## 遇到的问题

### 1. 模块化后要避免“拆而不清”

问题：如果只是把 JSX 挪到不同文件，但职责仍然混乱，后续维护收益会很有限。

处理：

- 明确让 `shell` 只管状态与编排
- 各 section 只负责对应简历模块展示
- 共用的文本读取、标签和日期格式统一放到 `published-resume-utils.ts`

### 2. 当前还不是共享设计系统

问题：模块组件拆出来后，很容易冲动继续抽到 `packages/ui`。

处理：

- 本次先停在 `apps/web` 内部模块化
- 把“跨应用共享边界整理”留给 `issue-34`
- 避免在同一个 issue 同时做页面模块化和共享层抽象

## 可沉淀为教程/博客的点

- 为什么公开页先做模块化，比先做视觉重设计更重要
- 如何把简历标准模型映射成稳定的页面 section
- 单文件展示壳如何渐进演进到可维护的模块化页面

## 后续待办

- 继续 `M7 / issue-34`：展示层整理，为后续 UI 升级预留边界
- `issue-34` 完成后整理 M7 教程大纲并关闭里程碑
