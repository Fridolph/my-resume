# M20 Follow-up vNext：优化记录中心 Table + Drawer 关联化

## 背景

- `优化记录` 页此前仍然是资料卡 + 独立缓存模块的组合，信息重心偏散。
- 用户希望把“最近优化记录”作为统一入口，在同一条记录下回看：
  - 简历优化建议
  - JD 匹配分析
  - Offer 对比建议
  - 简历评审分析
- 当前链路已经具备：
  - `resume-optimize` 返回 `resultId / usageRecordId`
  - `analyze` 返回 `usageRecordId`
  - `GET /api/ai/reports/history/:recordId`
  - `GET /api/ai/reports/resume-optimize/results/:resultId`
- 因此本轮不新增服务端关系表，而是用前端本地关联索引把一次输入下的多个 AI 调用串起来。

## 本次目标

- 把 `/dashboard/ai/optimization-history` 的最近优化记录改成 HeroUI `Table`。
- 新增右侧 `Drawer`，在一处查看一条优化记录关联的多种 AI 结果。
- 扩展本地历史持久化与关联索引，支持：
  - `usageRecordId`
  - `instructionHash`
  - 每个场景最新一次 `usageRecordId` 关联
- 保持实现教学友好，不增加服务端复杂度。

## 非目标

- 不新增服务端关系表。
- 不做同一场景的多版本历史数组。
- 不改 `resume-optimize/apply` 契约。
- 不做字段级 apply，不进入 M21 编辑器内联。

## 实际改动

- 扩展 [resume-optimization-persistence.ts](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/utils/resume-optimization-persistence.ts)
  - 新增 `instructionHash`
  - 新增 `usageRecordId`
  - 新增 `AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY`
  - 新增本地工具：
    - `normalizeOptimizationInstruction`
    - `createInstructionHash`
    - `appendAnalysisUsageRelation`
    - `readWorkbenchRelationIndex`
    - `upsertResumeOptimizationHistoryEntry`
  - 兼容旧 localStorage 数据结构，缺少新字段时自动兜底。

- 接入分析与优化成功回调
  - 在 [analysis-panel.tsx](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/components/analysis-panel.tsx) 中，辅助分析成功后按 `instructionHash + scenario` 写入本地关联索引。
  - 在 [ai-workbench-shell.tsx](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/ai-workbench-shell.tsx) 中，结构化优化成功后改为写入增强版历史记录。

- 重构优化记录页
  - 在 [resume-optimization-history-panel.tsx](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/components/resume-optimization-history-panel.tsx) 中，把资料卡切成 HeroUI `Table`。
  - 列固定为：
    - 生成时间
    - 优化摘要
    - 影响模块
    - 关联状态
    - 操作
  - 每行支持：
    - 查看详情
    - 打开结果页
  - 后续按本轮反馈继续收口：
    - 优化摘要列不再直接展示整段 instruction
    - 改为“标题 + 摘要 + 查看原文 Modal”
    - 标题优先取 Markdown H1，否则取第一条非空行
    - 表格操作区改成 icon button，避免操作列撑宽造成横向滚动
    - “回填到输入区”从优化记录页入口移除，避免在记录回看页触发影响范围较大的写入动作

- 新增记录详情抽屉
  - 新增 [optimization-history-record-drawer.tsx](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/components/optimization-history-record-drawer.tsx)
  - 通过分组切换组织：
    - 简历优化建议
    - JD 匹配分析
    - Offer 对比建议
    - 简历评审分析
  - 优化建议分组读取 `resultId` 对应详情。
  - 分析分组读取 `usageRecordId` 对应详情，并复用：
    - [analysis-report-overview.tsx](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/components/analysis-report-overview.tsx)
    - [analysis-report-details.tsx](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/components/analysis-report-details.tsx)
  - 当 `resultId` 命中不到服务端缓存时，不再把整个 Drawer 打成失败墙，而是仅让“简历优化建议”分组局部降级：
    - 提示“该条优化结果已失效或不可读取”
    - 保留本地摘要、影响模块和接口错误说明
    - 已关联的辅助分析分组仍可继续阅读
  - 后续补充 overlay 收口：
    - `Drawer` 改为 HeroUI v3 官方 controlled 写法，把 `isOpen / onOpenChange` 放到 `Drawer.Backdrop`
    - `Drawer.Content` 放回 `Drawer.Backdrop` 内，避免详情内容以内联块方式掉到表格下方
    - 同步修复 `AiAnalysisReportDrawer`，统一 AI 工作台与优化记录页的抽屉行为

- 收口页面信息架构
  - 在 [optimization-history-shell.tsx](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/optimization-history-shell.tsx) 中移除了独立 `AiCachedReportsPanel`。
  - 记录页主路径改为“Table 列表 → Drawer 详情”，不再把缓存体验作为大块主模块单独强调。

- 补充显示工具
  - 在 [analysis-utils.ts](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/utils/analysis-utils.ts) 中新增 `formatOptimizationModule`，统一模块中文标签。
  - 在 [resume-optimization-persistence.ts](/Users/fri/Desktop/personal/my-resume/apps/admin/app/[locale]/dashboard/ai/_ai/utils/resume-optimization-persistence.ts) 中新增 `extractOptimizationInstructionTitle`，把历史记录中的原始输入收口成可读标题。
  - `查看原文` Modal 也改为 HeroUI v3 controlled 写法，把 `isOpen / onOpenChange` 放到 `Modal.Backdrop`，保证 icon button 点击后稳定弹出摘要弹窗。

## Review 记录

- 选择前端本地关联索引，而不是新增服务端表：
  - 更适合当前教程节奏
  - 解释成本低
  - 不会把“记录关联”问题扩大成“服务端历史模型设计”
- 记录页改成 `Table + Drawer` 后，信息层次更清晰：
  - 列表层看“这次做了什么”
  - 详情层看“这次 AI 到底给了哪些结论”
- 结构化优化详情继续通过 `resultId` 读取，而不是把更多字段塞回 localStorage，避免本地状态过重。

## 遇到的问题

- HeroUI `Table` 在 v3 下暴露的是 `grid` 语义，不是传统 `table` role，测试断言需要相应调整。
- `Drawer + Tabs` 在 jsdom 下依赖 `getAnimations()`，测试中需要补 polyfill。
- `useRequest().send` 在测试桩下引用不稳定，若直接放进 effect 依赖会造成重复执行；抽屉详情拉取改成 `ref` 持有发送函数，避免循环更新。
- HeroUI v3 的受控 `Drawer` / `Modal` 不能沿用旧的根节点受控思路：
  - `Drawer` 必须由 `Drawer.Backdrop` 承担 open state，且 `Drawer.Content` 需要包在 `Backdrop` 里
  - `Modal` 必须由 `Modal.Backdrop` 承担 open state，否则点击 icon button 只会更新本地 state，不会真正弹层
- HeroUI `Modal` / `Drawer.CloseTrigger` 在 jsdom 下仍会出现一个 `PressResponder` 警告：
  - 当前不影响功能与测试通过，也不影响真实页面渲染
  - 这更像是测试环境下的 HeroUI 交互实现噪音，可以后续单独跟进

## 测试与验证

- 通过：
  - `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/analysis-panel.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/optimization-history-shell.spec.tsx'`
  - `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/optimization-history-shell.spec.tsx'`
  - `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/optimization-history-shell.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/analysis-panel.spec.tsx'`
  - `pnpm --filter @my-resume/admin exec tsc --noEmit`
  - `pnpm --filter @my-resume/admin build`

## 后续可写成教程/博客的切入点

- 为什么 AI 记录中心更适合 `Table + Drawer`，而不是“页面底部长文堆叠”
- 为什么优化记录列表里的 instruction 不应该直接裸露在表格单元格里，而应该收口成“标题 + Modal 原文”
- 如何利用 `usageRecordId + resultId + instructionHash` 在前端组织 AI 调用关联
- 为什么本轮先用本地 relation index，而不急着上服务端关系表
- 复合 AI 页面中，如何把“读取记录”和“再次触发分析”拆成两个清晰的产品层级
- 服务端结果 cache 会过期时，前端如何把 “Not Found” 变成“可回看、可再生成”的降级体验
