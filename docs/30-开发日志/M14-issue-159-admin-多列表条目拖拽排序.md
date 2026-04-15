# 开发日志

- Issue：#159
- 里程碑：M14 编辑体验与亮点表达重构
- 分支：`fys-dev/feat-m14-issue-156-158-web-theme-drag-sort`
- 日期：2026-04-06

## 背景

当前 admin 编辑器已经能覆盖完整简历 schema，但多列表模块仍只能通过“删除再重建”的方式调整顺序。对于个人链接、兴趣、教育、工作、项目、技能组、亮点这些高频维护内容，这种方式成本高，也不利于后续的发布校验。

## 本次目标

- 在 admin 中为主要列表模块补齐条目级拖拽排序。
- 保持现有 schema 不变，直接以数组顺序作为唯一排序来源。
- 确保排序后的 draft 保存、刷新读取和发布展示都能沿用现有链路。

## 非目标

- 不做 section 级别排序。
- 不新增 `order` 字段，也不引入服务端排序元数据。
- 不支持跨列表或跨模块拖拽。

## TDD / 测试设计

- 为拖拽 handle 渲染补组件测试，确认各模块都暴露可访问的排序触发器。
- 抽出纯函数 `reorderResumeCollection()`，直接覆盖重排逻辑测试，避免在 jsdom 里做脆弱的完整拖拽模拟。
- 继续保留保存草稿相关测试，确保重排后的数组顺序能进入 payload。

## 实际改动

- 在 `apps/admin/package.json` 中接入 `dnd-kit` 的 `core / sortable / modifiers` 三个依赖。
- 为 `ResumeDraftEditorPanel` 中的 `profile.links`、`profile.interests`、`education`、`experiences`、`projects`、`skills`、`highlights` 增加统一的 sortable wrapper 与 drag handle。
- 新增 `reorderResumeCollection()` 纯函数，集中处理数组重排逻辑，并在保存、初始化、重新加载时同步维护 sortable ids。
- 调整条目头部布局，让拖拽 handle、折叠按钮、删除按钮职责分离，避免误触。

## Review 记录

- 本轮排序只依赖前端数组顺序，完全复用既有 draft / publish 契约，符合当前 Issue 范围。
- 将重排逻辑抽离为纯函数后，后续如果新增更多列表模块，也可以直接复用。

## 自测结果

- `pnpm --filter @my-resume/admin test` ✅
- `pnpm --filter @my-resume/admin typecheck` ✅
- 手工检查拖拽 handle 已覆盖 links / interests / education / experiences / projects / skills / highlights ✅

## 遇到的问题

- `dnd-kit` 在 jsdom 下做完整拖拽交互测试较脆弱，尤其涉及 pointer 与 keyboard 两套传感器时更明显。
- 最终采用“组件层验证可排序结构 + 纯函数验证重排结果”的组合方式，让测试更稳、也更符合教学节奏。

## 可沉淀为教程/博客的点

- 在后台长表单里接入 `dnd-kit` 时，如何控制范围，只做“同组内部排序”而不把交互做得过重。
- 为什么数组顺序本身就是最适合教程型项目的排序持久化方案。

## 后续待办

- 做一轮三端人工联调，确认 admin 排序后 publish 到 web 的顺序刷新正常。
- 后续如果继续扩展排序体验，再考虑拖拽占位态、键盘引导文案和移动端细节增强。
