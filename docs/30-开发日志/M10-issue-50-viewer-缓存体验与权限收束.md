# M10 / issue-50 开发日志：viewer 缓存体验与权限收束

- Issue：`#89`
- 里程碑：`M10 AI 工作台与真实分析：从基础接口到后台闭环`
- 分支：`fys-dev/feat-m10-issue-50-viewer-cache-boundary`
- 日期：`2026-03-27`

## 背景

`issue-49` 已经把管理员真实分析闭环接通了，但如果到这里就停下，M10 仍然有一个明显缺口：

- admin 已能上传、分析、阅读结果
- viewer 还只是“不能做”的说明，没有真正“能体验什么”的页面闭环

这会带来两个问题：

- AI 成本控制边界不够直观
- 教程表达容易重新滑回“只有管理员能玩，viewer 只是占位”的状态

所以这一轮要做的是，把 viewer 的只读缓存体验真正落在页面上。

## 本次目标

- 让 viewer 只能读取缓存或预设分析结果
- 禁止 viewer 上传文件和触发真实分析
- 在页面级把边界讲清楚

## 非目标

- 不新增角色
- 不做复杂权限系统改造
- 不改写现有 auth 主模型
- 不做新的分析历史系统

## TDD / 测试设计

### 1. 先补缓存报告客户端测试

更新：

- `apps/admin/lib/ai-workbench-api.spec.ts`

先锁定：

- `/ai/reports/cache` 列表读取
- `/ai/reports/cache/:reportId` 详情读取

### 2. 再补缓存结果面板测试

新增：

- `apps/admin/components/ai-cached-reports-panel.spec.tsx`

先锁定：

- viewer 提示文案
- 首条缓存报告自动加载
- 切换另一条缓存报告时可更新详情
- 加载失败时有错误反馈

### 3. 用工作台壳测试保护角色差异

更新：

- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`

重点确认：

- `admin` 仍看到真实分析链路
- `viewer` 先看到缓存体验入口
- `viewer` 继续只能看到上传 / 分析的只读提示

### 4. 服务端权限回归

复用：

- `apps/server/test/ai-report-role-access.e2e-spec.ts`

目的是继续证明：

- viewer 读缓存可以
- viewer 触发新请求不行

## 实际改动

### 1. 扩展 AI 工作台缓存客户端

更新：

- `apps/admin/lib/ai-workbench.types.ts`
- `apps/admin/lib/ai-workbench-api.ts`
- `apps/admin/lib/ai-workbench-api.spec.ts`

这一步把 viewer 真正需要的两类读取能力补到了前端契约里：

- 缓存报告列表
- 缓存报告详情

这样缓存体验就不需要靠硬编码假数据，而是继续走 `apps/server` 的统一业务接口。

### 2. 新增缓存结果面板

新增：

- `apps/admin/components/ai-cached-reports-panel.tsx`
- `apps/admin/components/ai-cached-reports-panel.spec.tsx`

当前面板做的事情很聚焦：

- 读取缓存报告列表
- 自动打开第一条缓存报告
- 点击切换其他缓存报告
- 展示场景、语言、来源和分段结果
- 在 viewer / admin 两种语义下显示不同的顶部说明

这样 viewer 终于有一条真正可用的只读体验主线，而不是只看到“权限不足”的空盒子。

### 3. 调整 AI 工作台页面顺序与提示

更新：

- `apps/admin/components/admin-ai-workbench-shell.tsx`
- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`
- `apps/admin/app/globals.css`

这轮一个重要的教学判断，是不只加一个新面板，而是把 viewer 的页面顺序也一起收住：

- viewer 先看到“缓存结果体验”
- 再看到上传与真实分析的只读提示

这样体验顺序更自然，也更符合当前成本控制策略：

- 先告诉 viewer “你可以看什么”
- 再说明 “你不能触发什么”

后台说明文案也同步收口到更准确的状态，避免继续保留上一轮只适用于 `issue-49` 的描述。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本轮只完成：

- viewer 缓存读取体验
- 页面级边界收束
- 现有权限回归验证

没有越界去做：

- auth 模型扩张
- 新角色体系
- 分析历史持久化
- M10 里程碑文档收束

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

本轮已经完成当前最合适的一层抽离：

- 缓存读取客户端继续留在 `ai-workbench-api.ts`
- 缓存结果体验沉淀为 `AiCachedReportsPanel`

暂时不继续抽更高层的“只读 AI 页面模板”，因为当前后台仍然只有单个 AI 工作台页面，过早抽象会让教程变虚。

### 本次最重要的边界判断

viewer 体验不能只停留在“不允许”，必须落成“允许看什么”。

这是这轮最重要的教学价值：

- 成本控制不是只靠禁止按钮
- 还要给出一条可演示、可解释、可复用的只读体验链路

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-report-role-access.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

结果：

- `admin` 页面测试、类型检查、构建通过
- `server` viewer / admin AI 权限回归、类型检查、构建通过

补充说明：

- 本轮没有额外做人工点击验证，因为页面缓存体验、viewer 只读边界与服务端权限回归都已被双层自动化覆盖

## 遇到的问题

### 1. 如果只加缓存面板，不调整页面顺序，viewer 体验仍然会显得别扭

问题：

如果 viewer 进来先看到两个只读占位，再看到缓存结果面板，虽然功能上成立，但教学表达还是会偏向“先被拒绝，再告诉你还能干什么”。

处理：

- 把 viewer 的缓存面板放到工作台主列最前面
- 让 viewer 先看到体验入口

### 2. viewer 缓存体验和 admin 真实分析容易写成两套完全割裂的页面

问题：

如果完全分成两套页面，教程会更碎，后续也更难解释为什么两者仍属于同一个 AI 工作台。

处理：

- 仍保留单一工作台壳
- 只在页面内按角色切换体验顺序和入口可用性

## 可沉淀为教程 / 博客的点

- AI 成本控制为什么不能只靠“禁用按钮”
- 如何给 viewer 设计一条真正可用的缓存体验链路
- 为什么单一 AI 工作台壳比拆成两套页面更适合当前教程型仓库
- 如何用页面顺序表达角色边界，而不只是靠文案解释

## 后续待办

- 关闭 `issue-50`
- 进入 `issue-51`：M10 教程大纲与里程碑收束
