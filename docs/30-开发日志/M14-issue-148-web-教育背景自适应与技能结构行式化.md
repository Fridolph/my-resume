# 开发日志

- Issue：#148
- 里程碑：M14 编辑体验与亮点表达重构
- 分支：`fys-dev/feat-m14-issue-147-149-hero-skills-followup`
- 日期：2026-04-06

## 背景

公开简历页虽然已经能显示教育和技能模块，但教育卡片存在空字段占位过高的问题，技能组内部也还是“内容堆成一块”的阅读体验，不利于招聘方快速扫读。

## 本次目标

- 让教育模块按内容高度自适应，不再出现空白占位。
- 让技能结构视图支持把每一条 `keywords` 解析成更易读的“label + content”行式布局。

## 非目标

- 不修改 `skills.keywords: string[]` 契约。
- 不在后台新增技能子结构编辑器。

## TDD / 测试设计

- 为 web fixture 增加带 `profile.hero` 和结构化技能示例的数据。
- 在 `published-resume-shell` 测试中补三类技能输入解析断言：
  - `**label**: content`
  - `label：content`
  - 无分隔符纯文本
- 覆盖教育模块在缺失 `location / highlights` 时不渲染空块。

## 实际改动

- 调整 `PublishedResumeEducationSection` 为内容驱动布局，只在字段存在时渲染对应块。
- 重写 `PublishedResumeSkillsSection` 的默认结构视图解析逻辑，支持冒号拆分与 markdown 粗体 label 清洗。
- 为技能组卡片内部建立统一的逐行展示样式，左侧突出 label，右侧展示正文。

## Review 记录

- 本次只重做展示解析，不触碰后台 schema 和服务端数据结构，符合“展示层消费现有数据”的 issue 边界。
- 技能条目解析被收口成前端辅助逻辑，后续三视图切换可以直接复用。

## 自测结果

- `pnpm --filter @my-resume/web test` ✅
- `pnpm --filter @my-resume/web typecheck` ✅

## 遇到的问题

- 历史技能内容格式并不完全统一，有英文冒号、中文冒号和纯文本三种形态。
- 通过“优先按第一个 `:` / `：` 分割，否则整行直出”的宽松解析策略，兼顾了兼容性和展示稳定性。

## 可沉淀为教程/博客的点

- 如何在不升级后端 schema 的前提下，逐步把“自由文本数组”渲染成结构化简历模块。
- 内容驱动布局为什么比固定高度卡片更适合真实简历场景。

## 后续待办

- `#149` 将在此基础上增加 tag-cloud 与 chart 视图切换。
- 若后续需要更强的技能数据治理，再单开 issue 讨论是否把技能条目升级为结构化对象。
