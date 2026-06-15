# M26 bugfix / AI Chat 每日轮次重置

## 背景

公开站 AI Chat 采用“根据访客 IP 与本地记录识别会话，每天 20 轮对话”的 MVP 规则。实际测试发现旧 session 在跨天后仍返回 `closed / turnCount=20 / remainingTurns=0`，导致用户新一天无法继续对话。

同时本地 Next / Vitest 控制台出现 Node warning：`--localstorage-file was provided without a valid path`。

## 本次目标

- 同一 IP / 同一 public session 在新的本地自然日重新获得 20 轮公开站 AI Chat 额度。
- 不新建 session，不清空历史消息；跨天后复活同一个 session：`status=open`、`turnCount=0`、`remainingTurns=20`。
- `GET /ai/chat/sessions/:sessionId?useKey=...` 也触发幂等 rollover，刷新页面即可看到今日可继续对话。
- 只对公开站自动创建的 public chat 生效，Admin 手动 useKey 不自动每日复活。

## 实际改动

- `AiChatService` 增加 public session daily rollover：当 public session 的 `updatedAt` 不属于今天时，重置额度字段但保留 messages。
- rollover 更新 `status=open`、`turnCount=0`、`closedAt=null`、`usedTurns=0`，并清空 session 当前摘要字段；旧总结仍作为 system message 留在消息历史中。
- `getPublicSessionSnapshot` 和 `createAssistantReply` 都会先执行 rollover，避免直接 GET 或直接发送时仍卡在旧 closed 状态。
- `claimPublicSession` 改为复用同一 public useKey/session，跨天不再创建新 key / 新 session。
- `AiChatSessionSnapshot` / API Client 增加 `quotaDate`、`maxDailyTurns`、`totalUserTurns`，明确 `turnCount` 表示当前自然日已用轮次。
- Web consent 改为按 policy version 记忆，不再因为 `consentDay` 是昨天就清理本地 session；旧 session 由服务端 GET snapshot 自动 rollover。

## Review 记录

- 本次没有新增数据库表、环境变量或 npm 依赖。
- 每日重置按服务端本地自然日计算，和前端本地日期语义保持一致。
- 历史消息保留；每日额度和 session 当前摘要重置，避免第 20 轮结束态阻塞新一天。
- revoked / expired useKey 不会被 rollover 复活。
- 手动 Admin useKey 不参与 public daily rollover，避免改变治理台发码语义。

## 测试与验证

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/ai/chat/__tests__/ai-chat.service.spec.ts --pool forks --poolOptions.forks.singleFork`
- `pnpm --dir apps/web exec vitest run app/_shared/ai-chat/__tests__/ai-chat-context.spec.tsx`
- `pnpm --filter @my-resume/api-client test -- src/ai.spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/api-client typecheck`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm check:tsx-types`
- `git diff --check`

## 后续风险

- 当前“每天 20 轮”仍依赖 IP 识别；代理、内网共享 IP、移动网络切换都可能影响体验，后续如果需要更强约束，应引入更明确的匿名访客标识策略。
- 跨天后的第 10/20 轮 summary 会覆盖 session 当前摘要字段；旧 summary 仍可从 system message 历史回看。如需多日 summary 列表，后续应单独建模。
- api-client 测试在 Node 25 下仍可能出现 `--localstorage-file` warning；本轮确认测试通过，后续可单独定位剩余依赖来源。
