# M12 / issue-121 开发日志：AI 分析结果契约稳定化

- Issue：`#121`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/feat-m12-ai-analysis-contract-stabilization`
- 日期：`2026-03-31`

## 背景

当前仓库已经具备 AI 工作台最小闭环：

- 管理员可上传文件
- 管理员可触发真实分析
- 管理员可生成结构化简历建议并一键应用到草稿
- viewer 只能读取缓存结果

但 `POST /ai/reports/analyze` 仍偏“工程验证态”：

- 返回主内容还是自由文本
- 前端主要依赖 `summary + sections`
- 结果虽然能显示，但还不够稳定、可解释、可继续长成产品能力

如果继续沿着自由文本往下做，会出现两个问题：

- 前端越来越需要“猜”字段含义
- 后续 diff / apply / 模块级确认会缺少稳定上游输入

所以这轮先不继续扩 UI，而是先把“分析结果契约”收住。

## 本次目标

- 稳定 `POST /ai/reports/analyze` 的响应结构
- 让结果明确分成“结论层 / 依据层 / 建议层”
- 给关键字段补上代码注释，说明字段存在理由与呈现意图
- 为后续建议稿 diff 预览和模块级 apply 打地基

## 非目标

- 不做 diff 预览
- 不做模块级勾选 apply
- 不重做整个 AI 工作台页面结构
- 不引入 AI 历史持久化或任务队列
- 不扩展 viewer 新能力

## TDD / 测试设计

### 1. 先锁服务端结构化契约

更新：

- `apps/server/src/modules/ai/analysis-report-cache.service.spec.ts`
- `apps/server/test/ai-report-role-access.e2e-spec.ts`
- `apps/server/test/ai-report-cache.e2e-spec.ts`

验证：

- mock 缓存报告必须稳定返回 `score / strengths / gaps / risks / suggestions`
- 管理员真实分析返回的结果也必须具备同样的结构
- 兼容层 `sections` 仍然存在，但不再是唯一主结构

### 2. 再锁前端结构化展示

更新：

- `apps/admin/components/ai-analysis-panel.spec.tsx`

验证：

- 后台分析面板不再只渲染旧的 `sections`
- 页面能够直接展示：
  - 评分
  - 判断理由
  - 已有优势
  - 待补缺口
  - 风险提示
  - 建议动作

## 实际改动

### 1. 服务端新增稳定的结构化分析字段

更新：

- `apps/server/src/modules/ai/analysis-report-cache.service.ts`

新增结构：

- `score`
- `strengths`
- `gaps`
- `risks`
- `suggestions`

并补了字段级注释，说明：

- `score` 用来帮助用户快速判断优先级，不是绝对分
- `strengths / gaps / risks` 是让用户“理解并信服”的依据层
- `suggestions` 要尽量指向 `profile / experiences / projects / highlights`
- `sections` 当前作为兼容层保留，避免本轮一次性打碎缓存阅读面板

### 2. 真实 Provider 改成优先返回 JSON

更新：

- `apps/server/src/modules/ai/ai-report.controller.ts`

这轮把 `analyze` 的 prompt 收成了：

- 明确要求只输出 JSON
- 明确输出字段结构
- 明确 `strengths / gaps / risks / suggestions` 各自承担什么业务语义

同时保留了 fallback：

- 如果 Provider 没有返回合法 JSON
- 或当前处于 mock 模式

服务端仍会生成一份稳定的结构化结果，保证开源环境和教程环境都能继续工作。

### 3. 后台分析面板改成三层展示

更新：

- `apps/admin/lib/ai-workbench-types.ts`
- `apps/admin/components/ai-analysis-panel.tsx`

页面上现在明确分成三层：

- 结论层：摘要 + 评分 + 判断理由
- 依据层：已有优势 / 待补缺口 / 风险提示
- 建议层：建议模块 + 原因 + 可执行动作

这比之前只显示一段文本更稳，因为用户可以先理解：

- 结果是什么
- 为什么这样判断
- 建议改哪里

再决定后续是否继续生成建议稿、是否应用到草稿。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本轮只收：

- `analyze` 契约稳定化
- 后台分析结果结构化展示
- 相关测试与注释

没有越界去做：

- diff 预览
- 模块级 apply
- AI 历史
- 队列与任务中心

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

有一个潜在抽离点：

- “分析结果展示卡片”后续可以抽成共享组件

但当前只有 AI 工作台一处消费，而且下一期还会继续长出 diff 预览与模块选择，所以这轮刻意不提前抽，以免过早抽象。

### 本次最重要的边界判断

这轮的关键不是“让 AI 返回更多字段”，而是：

- 不再让前端从自由文本里猜结构
- 先把结果解释清楚，再谈建议稿与 apply

也就是说，这轮是把 AI 能力从“黑盒按钮”往“可解释辅助决策”推进了一层。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server test -- src/modules/ai/analysis-report-cache.service.spec.ts`
- `pnpm --filter @my-resume/admin test -- components/ai-analysis-panel.spec.tsx`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/server test:e2e`

结果：

- 服务端分析契约测试通过
- 后台结构化展示测试通过
- `server / admin` 类型检查通过
- `server` e2e 通过

补充说明：

- `server` e2e 在当前沙箱内直接运行会因为端口权限报 `listen EPERM`
- 提权后重跑通过，说明本轮改动本身没有引入接口回归

## 遇到的问题

### 1. 真实 Provider 不一定稳定返回 JSON

问题：

即使 prompt 已经要求 JSON，真实 Provider 仍有可能返回自由文本或夹带代码块。

处理：

- 服务端先尝试解析 JSON
- 失败后回退到稳定的 fallback 结构

这样可以同时保证：

- 真实 Provider 优先输出结构化结果
- mock 与异常响应也不会打断当前开源版主线

### 2. viewer 缓存阅读面板不能被本轮顺手打碎

问题：

如果直接删掉旧的 `sections`，当前缓存阅读面板会被连带打碎，超出本轮范围。

处理：

- 保留 `sections` 作为兼容层
- 主展示面板先转向新结构字段
- 缓存阅读面板后续再在独立 issue 中继续收

## 后续切入点

这轮完成后，后续最自然的下一步是：

1. 基于 `suggestions` 做建议稿 diff 预览
2. 将建议稿应用改成模块级确认，而不是直接一键写回
3. 继续整理 AI 输入体验，让 `JD / 优化要求 / offer 对比` 的入口更清楚

## 一句话总结

这轮不是把 AI 做得“更花”，而是把 AI 的分析结果先做得“更像一个可信的产品输入”。
