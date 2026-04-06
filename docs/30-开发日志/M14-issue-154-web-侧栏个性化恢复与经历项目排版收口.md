# 开发日志

- Issue：#154
- 里程碑：M14 编辑体验与亮点表达重构
- 分支：`fys-dev/feat-m14-issue-153-155-sidebar-skill-echarts`
- 日期：2026-04-06

## 背景

公开简历页的基础结构已经稳定，但左侧 sticky sidebar 还偏平，联系信息、公开链接和兴趣方向的表达不够鲜明。与此同时，工作经历和代表项目虽然信息齐全，但正文、技术栈、链接之间的节奏还不够统一。

## 本次目标

- 恢复侧栏更有记忆点的个性化表达，让 links / interests 真正利用 icon 配置。
- 收口联系信息、公开链接和兴趣模块的交互与对齐方式。
- 调整工作经历与项目模块的段落节奏、标题装饰线和技术栈样式。

## 非目标

- 不改 admin 编辑器逻辑。
- 不重做公开页信息架构。
- 不新增新的共享字段。

## TDD / 测试设计

- 更新 `published-resume-shell` 相关 fixture，覆盖 links icon、interest icon 和新结构。
- 校验有 icon 的链接进入 icon 模式、无 icon 时回退文字模式。
- 校验兴趣模块可渲染 icon + label，工作/项目技术栈使用 badge 风格。

## 实际改动

- 在 `published-resume-hero.tsx` 中重做 links / interests 展示：
  - links 有 icon 时渲染为圆形 icon chip，并在 hover/focus 时展示标签；
  - interests 改成带位移和过渡的互动卡片，而不是纯文本列表。
- 在 `apps/web/app/globals.css` 中新增 `contact-item`、`profile-link-chip`、`interest-card` 等样式，让侧栏信息密度更高但仍保留个性化反馈。
- 在工作经历和项目模块中统一摘要、亮点、技术栈、链接的左边线和段落节奏。
- 将技术栈与项目链接统一收成更轻的小号 badge/pill，减少正文被装饰打断的感觉。

## Review 记录

- 侧栏个性化只集中在链接、兴趣和 hover 反馈上，没有让整个简历页过度营销化。
- 工作和项目模块仍复用同一套时间线语言，只是把线条和内容对齐方式收得更干净。

## 自测结果

- `pnpm --filter @my-resume/web test` ✅
- `pnpm --filter @my-resume/web typecheck` ✅

## 遇到的问题

- links 需要同时兼容“图标模式”和“纯文字模式”，如果组件拆分得过度会让样式和语义分裂。
- 最终在同一组件里按 `icon` 是否存在做分支，并通过共享 class 维持交互一致性。

## 可沉淀为教程/博客的点

- 简历类站点里，什么时候该用 icon 提升识别度，什么时候又应该回退到文字卡片保证可读性。
- 如何在不推翻既有布局的前提下，用小范围样式重构改善段落节奏与信息密度。

## 后续待办

- 继续在技能区完成统一词云与更强的图表表达，让公开页右侧主体也有对应的视觉升级。
