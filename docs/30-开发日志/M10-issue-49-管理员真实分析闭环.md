# M10 / issue-49 开发日志：管理员真实分析闭环

- Issue：`#91`
- 里程碑：`M10 AI 工作台与真实分析：从基础接口到后台闭环`
- 分支：`fys-dev/feat-m10-issue-49-admin-live-analysis`
- 日期：`2026-03-27`

## 背景

`issue-47` 先搭起了后台 AI 工作台壳，`issue-48` 又把“上传 -> 提取 -> 预览”输入链路接了出来。

但如果后台还不能真正触发分析，这条线就仍然停留在“工作台入口 + 输入准备”阶段，M10 也很难算形成闭环。

所以这一轮只往前推一小步，但这一步很关键：

- 让管理员基于当前输入触发真实分析
- 把服务端返回结果真正展示在页面里
- 保持业务逻辑继续只在 `apps/server`

## 本次目标

- 让 `admin` 能基于手动输入或提取文本触发真实分析
- 展示 Provider / model / 场景与结果结构
- 让错误反馈可见、输入链路可接力

## 非目标

- 不引入 Redis / BullMQ 队列
- 不做分析历史持久化
- 不做复杂 Prompt 编排系统
- 不在本轮做 viewer 缓存体验收束

## TDD / 测试设计

### 1. 先补分析 API 客户端测试

更新：

- `apps/admin/lib/ai-workbench-api.spec.ts`

先锁定：

- `/ai/reports/analyze` 的请求地址、鉴权头和请求体
- 服务端错误信息会被正确抛出

### 2. 再补分析面板测试

新增：

- `apps/admin/components/ai-analysis-panel.spec.tsx`

先锁定：

- `viewer` 只读提示
- 管理员触发真实分析后可看到结果
- 失败状态会显示错误
- 空输入不会直接发请求

### 3. 用工作台壳测试保护输入接力

更新：

- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`
- `apps/admin/components/ai-file-extraction-panel.spec.tsx`

重点确认：

- 文件提取面板可把结果交给分析输入区
- 工作台壳已经同时承接“提取入口”和“真实分析入口”

### 4. 服务端回归

复用：

- `apps/server/test/ai-report-role-access.e2e-spec.ts`

目的不是重写服务端，而是证明这次前端接入的管理员触发链路，确实还挂在现有服务端权限边界之上。

## 实际改动

### 1. 扩展 AI 工作台客户端契约

更新：

- `apps/admin/lib/ai-workbench-types.ts`
- `apps/admin/lib/ai-workbench-api.ts`
- `apps/admin/lib/ai-workbench-api.spec.ts`

这一步补了两层东西：

- 前端对分析结果结构的类型描述
- 触发 `/ai/reports/analyze` 的最小 API 客户端

这样页面侧就不需要直接拼请求，也不用在组件里手写错误解析。

### 2. 新增真实分析面板

新增：

- `apps/admin/components/ai-analysis-panel.tsx`
- `apps/admin/components/ai-analysis-panel.spec.tsx`

当前面板只做当前阶段真正需要的事情：

- 选择分析场景
- 选择输出语言
- 输入或接收分析内容
- 触发真实分析
- 展示结果摘要、Provider 信息和结果分段
- 显示失败信息

这里刻意没有继续做“历史记录列表”“重新打开旧结果”“多任务并发态”等能力，避免把同步最小闭环再次扩张成一个半成品工作流系统。

### 3. 把文件提取结果接到分析输入区

更新：

- `apps/admin/components/ai-file-extraction-panel.tsx`
- `apps/admin/components/ai-file-extraction-panel.spec.tsx`
- `apps/admin/components/admin-ai-workbench-shell.tsx`
- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`

本轮最关键的不是单独再加一个分析面板，而是把上轮输入链路接上来：

- 文件提取成功后，结果会同步进分析输入区
- 管理员可以直接在此基础上继续编辑，再触发真实分析

这样 `issue-48` 和 `issue-49` 之间形成了真正连续的教学主线，而不是两个互不相干的功能块。

### 4. 微调结果阅读样式

更新：

- `apps/admin/app/globals.css`

原本真实分析结果会把整段 AI 返回内容塞进标题区域。自动化测试能通过，但人工验证时会发现页面阅读体验很差。

所以这轮顺手收了一步：

- 长文本改为正文块展示
- 结果卡片与分段卡片增加最小样式承载
- `select` 样式和分析区布局补齐

这属于当前 issue 内必要的可读性修正，不是 UI 大改。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本轮只完成：

- 管理员真实分析触发
- 结果阅读
- 文件提取到分析输入的接力
- 错误反馈与最小样式承载

没有越界去做：

- 队列与异步任务
- 分析历史持久化
- viewer 缓存体验页面
- 新的服务端业务接口扩张

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

本轮已经完成当前最合适的一层抽离：

- `ai-workbench-api.ts` 继续承载工作台 API 调用
- `AiAnalysisPanel` 作为独立分析入口组件
- `AiFileExtractionPanel` 通过回调与分析区接力

暂时不继续抽“更高阶 AI 编排组件”，因为后续 `issue-50` 还会继续调整 viewer 边界与缓存体验，过早抽大组件只会让共享边界变虚。

### 本次最重要的边界判断

当前阶段先做同步最小闭环，而不是直接上队列，是合理的。

原因：

- 先证明“管理员真实分析入口真的能工作”
- 再考虑异步任务、缓存命中、历史列表这些更复杂结构
- 对教程型仓库来说，先有一条完整短链路，比一开始铺开完整编排更适合教学

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-report-role-access.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

结果：

- `admin` 自动化测试、类型检查、构建通过
- `server` 真实分析权限回归、类型检查、构建通过

补充说明：

- `admin typecheck` 与 `next build` 并行运行时会因为 `.next/types` 重建互相影响，因此最终结果以顺序执行为准

### 人工验证

本地临时启动：

- `apps/server`：`http://localhost:5577`
- `apps/admin`：`http://localhost:5566`

实际验证过程：

- 使用 `admin / admin123456` 登录后台
- 进入 `http://localhost:5566/dashboard/ai`
- 手动输入 `NestJS React TypeScript 简历优化`
- 触发真实分析
- 页面成功展示：
  - 当前 Provider / model
  - 场景与语言
  - 真实返回结果正文
  - Provider 信息与下一步分段

## 遇到的问题

### 1. 真实分析长文本一开始被当成标题渲染

问题：

自动化测试能过，但人工验证时会看到整段 AI 返回内容被塞进 `h3`，阅读体验很差。

处理：

- 改成标题 + 正文块结构
- 保留结果分段卡片

这次调整说明，当前流程里的人工校验确实有价值，不只是补形式。

### 2. `admin typecheck` 与 `build` 并行时会互踩 `.next/types`

问题：

并行跑两条命令时，`typecheck` 会因为 `.next` 目录正在重建而报 `TS6053`。

处理：

- 改为顺序执行
- 记录到本轮日志中，避免后续误判为业务代码回退

## 可沉淀为教程 / 博客的点

- 为什么 AI 工作台的第二步不是“上队列”，而是先把管理员真实分析链路接通
- 如何把文件提取输入平滑接到真实分析入口，而不是做成两个割裂模块
- 为什么坚持把 AI 业务逻辑继续收敛在 NestJS，而不顺手放进 Next.js
- 自动化测试之外，人工校验如何发现“结果可读性”这类不会直接体现在测试里的问题

## 后续待办

- 关闭 `issue-49`
- 继续 `issue-50`：viewer 缓存体验与权限收束
- 最后进入 `issue-51`：M10 教程大纲与里程碑收束
