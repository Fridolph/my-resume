# M14 / issue-165 / admin-resume-editor-超长组件拆分与测试重构

- Issue：`[Refactor] M14 / issue-admin-resume-editor-超长组件拆分与测试重构`
- 里程碑：`M14 编辑体验与亮点表达重构`
- 分支：`fys-dev/feat-m14-issue-163-165-component-refactor`
- 日期：`2026-04-07`

## 背景

`ResumeDraftEditorPanel` 在功能不断补齐后已经演变成超长文件：模块渲染、sortable 基础件、空数据工厂、字段序列化、翻译辅助与保存逻辑都耦合在一起，后续继续加功能会明显失控。

## 本次目标

- 将简历编辑器拆成“容器 + section 组件 + helper + primitive”
- 保持保存、拖拽排序、双语编辑和发布链路语义不变
- 让测试路径与职责划分同步收口

## 非目标

- 不改 `StandardResume` 契约
- 不新增新的编辑功能或 UI 方案
- 不调整 draft / publish / published API

## TDD / 测试设计

- 保留原有高价值测试：加载草稿、双语编辑、保存、拖拽排序、各模块编辑
- 将纯函数 `reorderResumeCollection` 下沉到 helper 后，由测试直接从 helper 引入
- 在重构后跑完整 `admin` 测试与类型检查，确认大文件拆分没有带回归

## 实际改动

- 新增 `draft-editor-helpers.ts`，承载：
  - 空数据工厂
  - draft field build / parse / merge
  - sortable 集合 helper
  - 复制 / 清空翻译辅助
- 新增 `editor-primitives.tsx`，承载：
  - `EditorSection`
  - `EditorEntry`
  - `LocalizedEditorField`
  - `IconActionButton`
  - `SortableItemShell`
- 新增各模块 section：
  - `profile-section.tsx`
  - `education-section.tsx`
  - `experiences-section.tsx`
  - `projects-section.tsx`
  - `skills-highlights-sections.tsx`
- `draft-editor-panel.tsx` 改为容器主文件，并真正接入已抽出的 helper，删除重复定义
- 测试迁移到 `components/resume/__tests__/draft-editor-panel.spec.tsx`，并对齐 helper 的真实行为语义

## Review 记录

- 主容器目前已聚焦在数据加载、状态切换、保存与模块间编排
- section 拆分后，每个模块的字段渲染边界更清晰
- helper 已成为可直接复用和单测的纯函数层，后续继续演进会更稳

## 自测结果

- `pnpm --filter @my-resume/admin test` ✅
- `pnpm --filter @my-resume/admin typecheck` ✅
- `pnpm --filter @my-resume/web test` ✅
- `pnpm --filter @my-resume/web typecheck` ✅

## 遇到的问题

- 在 helper 真正接入后，测试里对旧导出位置和旧文案语义的断言失效
- 项目亮点的双语保留行为也需要与当前翻译工作区语义重新对齐

## 可沉淀为教程/博客的点

- 如何拆解一个 3000+ 行的 React 表单编辑器而不打断发布链路
- dnd-kit + 多模块表单场景下，排序逻辑如何抽成纯函数

## 后续待办

- 若后续继续增长，可再把翻译动作工具条抽成独立子组件
- 继续观察主容器中是否还有适合下沉的 action / state 组合
