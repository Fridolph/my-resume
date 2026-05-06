# M22 / Issue 214 - 简历导入全局 AI 进度浮窗与渐进式时间线

- Issue：`#214`
- 里程碑：`M22 AI 简历导入体验治理`
- 分支：`fys-dev/feat-m22-issue-214-ai-progress-toast`
- 日期：`2026-05-06`

## 背景

简历导入识别已经接入 SSE，但真实 AI 识别阶段仍可能持续 1-5 分钟。用户一旦切走页面或刷新页面，当前进度容易被忽略；同时任务时间线前置阶段完成过快，页面会瞬间铺满多个完成项，再在 AI 生成阶段长时间停住，体感上仍像“卡死”。

本轮把体验目标收敛为前端感知层优化：让 AI 任务进度跨 Admin 页面保持可见，并用渐进式时间线缓冲“前快中慢”的观感，但不改变后端真实任务、不延迟 SSE、不扩展识别链路。

## 本次目标

- 在 Admin 受保护布局中接入全局 AI 任务进度浮窗。
- 第一版只承载 `resume-import` 任务，复用现有 `jobId`、`GET job` 和 SSE stream。
- 上传成功后由全局 Provider 统一维护任务、心跳、进度提示和本地耗时。
- 简历导入页面继续展示完整任务面板，但数据来自全局 Provider。
- 前 30 秒对 `ai_generating` 前的快步骤做前端感知式逐步显露。
- 优化状态 Chip、耗时展示和 Accordion trigger 密度。

## 非目标

- 不改后端 SSE event 类型和 wire shape。
- 不人为拖慢真实 Job 进度。
- 不调整 AI prompt、结构化输出或 JSON repair 链路。
- 不进入 `#180` RAG 问答、citations 或检索体验。
- 不做通用多任务队列；第一版只注册简历导入任务。

## 实际改动

### Admin 全局进度层

- 新增 `AiTaskProgressProvider`：
  - 从 `localStorage` 恢复正在进行的简历导入 `jobId`。
  - 使用 `GET /jobs/:jobId` 恢复快照。
  - 使用现有 `streamAiResumeImportJob` 继续订阅 SSE。
  - 统一维护 `resumeImportJob`、`displayElapsedMs`、`lastHeartbeatAt`、`progressHint` 和 `connectionError`。
- 新增 `AiTaskProgressToast`：
  - 固定在 Admin 右上角展示任务名、状态、当前阶段、最近提示、最近心跳和大号耗时。
  - 移动端降级到底部浮层。
  - `completed / failed` 后短暂保留结果态。
  - 完成态提供“查看结果”，运行态提供“查看进度 / 刷新”。
  - 收口前补充为 HeroUI Modal 风格的非阻塞浮层卡片，增加标题区、进度条、信息区和操作区。
  - 增加“缩小”按钮；缩小后固定右上角展示任务名、状态点和感知百分比，点击迷你态可恢复完整卡片。
- 新增 `AiTaskStatusChip`：
  - `running` 使用蓝色动效圆点。
  - `completed / failed / pending` 使用对应状态色。

### Admin 布局接入

- `AdminProtectedLayout` 在已登录且有 `accessToken` 时包裹 `AiTaskProgressProvider`。
- 未登录 / loading 分支不挂载 Provider，避免无 token 时触发恢复请求。

### 简历导入面板

- `ResumeImportPanel` 不再直接持有 SSE 与本地 Job 状态。
- 上传成功后调用 `registerResumeImportJob(nextJob)`，由全局 Provider 继续订阅和恢复。
- 页面内仍保留手动刷新作为 SSE 中断兜底。
- 顶部状态卡调整为：
  - 任务状态 Chip；
  - 当前阶段和最近 progress hint；
  - 状态色大号耗时。
- Accordion trigger 改为紧凑一行：阶段标题、摘要、状态 Chip、展开图标；详细内容保留在 Panel。

### 渐进式时间线

- 新增纯展示 helper：`buildPerceivedResumeImportSteps(job, elapsedMs)`。
- 仅在 `running + ai_generating` 且前 30 秒生效。
- 前 30 秒按约 5 秒节奏逐步显露 AI 生成前的完成阶段。
- 被暂缓显露的阶段只展示为 `pending`，并隐藏 summary/details。
- `completed / failed` 或 30 秒后立即展示真实时间线，不影响后端状态。
- 浮窗百分比同样是前端感知值，不扩展后端协议；`completed` 固定 `100%`，`failed` 显示失败态。
- `ai_generating` 前 30 秒增加百分比上限，避免一进入长耗时阶段就显示过高进度。

## Review 记录

- 范围检查：本轮只改 Admin UX 和测试，不改 server/API wire shape。
- 状态所有权：把恢复、SSE、心跳、耗时统一放入 Provider，避免页面组件和浮窗双重订阅。
- 可访问性：浮窗使用 `aria-live="polite"`，避免长任务提示完全依赖视觉变化。
- 交互取舍：完整态仍是非阻塞浮层，不使用真正 Modal 遮罩和焦点陷阱，避免干扰用户继续操作后台页面。
- 教学边界：渐进式时间线明确是“感知层”，不伪造服务端真实状态，也不增加后端等待。
- 测试策略：对 Provider 做恢复和 SSE 提示测试；对渐进式时间线做纯函数测试，避免把 UI 细节写成脆弱快照。

## 测试与验证

已执行：

```bash
pnpm --dir apps/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/resume-import-panel.spec.tsx' 'app/[locale]/dashboard/_shared/__tests__/ai-task-progress.spec.tsx' 'app/[locale]/dashboard/_shared/__tests__/protected-layout.spec.tsx'
pnpm --filter @my-resume/admin typecheck
pnpm --filter @my-resume/api-client test -- src/ai.spec.ts
pnpm check:tsx-types
git diff --check
```

## 遇到的问题

- 新增 Provider 后，布局测试需要确保已登录状态包含 `accessToken`，否则不会进入受保护工作区。
- `AiTaskProgressToast` 完成态里会同时出现状态 Chip 和结果文案，测试断言不能直接使用单个 `findByText('已完成')`，应优先断言稳定的 `data-testid`。
- `buildPerceivedResumeImportSteps` 目前仍放在组件文件中，测试导入时会带入客户端依赖；本轮用最小 mock 收口，后续如果感知规则继续扩展，可迁到独立纯函数文件。

## 后续可写成教程/博客的切入点

- 长耗时 AI 任务为什么需要“全局可见进度”。
- SSE 任务恢复：`localStorage jobId + GET snapshot + stream` 的最小闭环。
- 如何区分“真实进度”和“感知进度”，避免为了动画拖慢真实流程。
- 前端测试如何避开过度依赖 UI 文案，优先断言稳定行为和状态。

## 后续建议

- 如果后续接入多个 AI 任务，可把 Provider 的 `resumeImportJob` 扩展为任务 map，但不要在本 Issue 中提前铺满队列模型。
- 如果浮窗交互继续沉淀，可把 `AiTaskStatusChip` 下沉为 Admin 共享状态组件。
- 如果渐进式时间线规则增加，建议把 helper 移到独立 `ai-task-progress-perception.ts`，保持组件文件轻量。
