# M14 / issue-164 / admin-ai-analysis-panel-职责拆分与测试收口

- Issue：`[Refactor] M14 / issue-admin-ai-analysis-panel-职责拆分与测试收口`
- 里程碑：`M14 编辑体验与亮点表达重构`
- 分支：`fys-dev/feat-m14-issue-163-165-component-refactor`
- 日期：`2026-04-07`

## 背景

`AiAnalysisPanel` 已超过 500 行，并同时承载状态、副作用、表单提交、报告渲染与建议展示，继续堆在单文件内会让后续测试与 UI 收口越来越困难。

## 本次目标

- 将 `AiAnalysisPanel` 拆成容器 + 纯展示块 + 工具函数
- 把长条件 JSX 从主返回体中移走
- 保持 AI 工作台现有交互与测试语义不变

## 非目标

- 不重做 AI 工作台信息架构
- 不改分析接口协议与缓存报告协议
- 不新增新的 AI 能力或业务按钮

## TDD / 测试设计

- 保留原有行为测试：真实分析、建议渲染、模块应用、只读限制
- 先拆文件，再根据真实渲染结果修复工作台测试断言
- 用现有集成测试保证拆分后仍能串起完整 AI 工作台

## 实际改动

- 新增 `analysis-form.tsx`
- 新增 `analysis-report-overview.tsx`
- 新增 `analysis-report-details.tsx`
- 新增 `analysis-suggestion-panel.tsx`
- 新增 `analysis-utils.ts`
- 保留 `analysis-panel.tsx` 作为容器，只负责状态、事件与 API 交互
- 同步修正 `ai-workbench-shell` 相关测试，使其断言真实缓存面板内容而不是旧占位文案

## Review 记录

- 主容器职责已收缩到“状态编排 + 数据流”
- 报告展示块均为纯 props 驱动，后续更容易单测和继续微调 UI
- 长条件 JSX 被具名子组件替代，可读性明显提升

## 自测结果

- `pnpm --filter @my-resume/admin test` ✅
- `pnpm --filter @my-resume/admin typecheck` ✅

## 遇到的问题

- 目录迁移后，旧 mock 路径与真实渲染路径不一致，导致测试实际走了真组件
- 解决方式是保留真实渲染断言，并同步修正 mock / 断言语义

## 可沉淀为教程/博客的点

- 超长 React 面板如何拆成“容器 + 展示块 + utils”
- 测试在重构中如何从“占位断言”升级为“真实行为断言”

## 后续待办

- 继续观察 AI 工作台是否还需要把公共展示组件进一步沉淀到 `packages/ui`
- 后续若接入更多场景，可继续按同样方式拆分场景级面板
