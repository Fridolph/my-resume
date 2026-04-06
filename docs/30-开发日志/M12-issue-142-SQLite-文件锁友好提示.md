# M12 / issue-142 开发日志：SQLite 文件锁友好提示

- Issue：`#142`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/fix-m12-issue-142-sqlite-busy-hint`
- 日期：`2026-04-05`

## 背景

在 M12 三端联调人工验收中，第一次执行草稿保存时，后端返回了模糊的 `500 Internal Server Error`。

进一步排查后确认，根因不是简历结构校验失败，而是本地 SQLite 文件 `.data/my-resume.db` 被外部数据库工具占用，导致写入阶段触发：

- `SQLITE_BUSY: database is locked`

这类问题对本地开发者很常见，但如果服务端直接把它冒成通用 500，就很容易让人误判成业务逻辑坏了。

## 本次目标

- 把本地 SQLite 文件锁错误映射成更可读的服务端提示
- 让 `getDraft / updateDraft / publish` 三个入口都能给出一致反馈
- 在服务端说明中补充最小本地开发提醒

## 非目标

- 不切换数据库方案
- 不改造 `Drizzle + libsql` 持久化主线
- 不引入复杂重试机制或连接池策略

## 实际改动

### 1. 新增 SQLite 锁错误识别辅助

新增：

- `apps/server/src/database/sqlite-lock.ts`

这里做了两件事：

- 统一定义本地文件锁时返回给开发者的提示文案
- 递归检查异常链中的 `message / code / cause`，识别：
  - `SQLITE_BUSY`
  - `database is locked`
  - `database is busy`

这样就算底层是 `DrizzleQueryError -> LibsqlError -> SqliteError` 这样的多层嵌套，也能稳定识别。

### 2. 在简历发布服务中统一翻译文件锁错误

更新：

- `apps/server/src/modules/resume/resume-publication.service.ts`

本轮没有把处理分散到多个 controller，而是放在 `ResumePublicationService` 内统一处理。原因是：

- `getDraft` 在没有草稿时也会触发写库
- `updateDraft` 会写 draft
- `publish` 会写发布快照
- 其他上层调用者也能共享这层翻译结果

现在只要命中 SQLite 文件锁，就会抛出更明确的 `ServiceUnavailableException`，提示开发者先关闭 DB Browser 等工具再重试。

### 3. 补齐服务端测试

更新：

- `apps/server/src/modules/resume/resume-publication.service.spec.ts`

新增覆盖：

- 草稿保存遇到 SQLite 文件锁时返回友好提示
- 发布遇到 SQLite 文件锁时返回友好提示
- 草稿初始化写入遇到 SQLite 文件锁时返回友好提示

### 4. 补齐前端请求层错误透传

更新：

- `packages/api-client/src/resume.ts`
- `packages/api-client/src/resume.spec.ts`

除了服务端要能识别 SQLite 文件锁，本轮还补了一层很关键的收口：

- 当前端调用 `/resume/draft` 或 `/resume/publish` 失败时，优先读取服务端返回的 `message`
- 如果是字符串就直接透传
- 如果是数组，就拼接成更可读的中文提示

这样后台最终看到的就不再是笼统的“草稿保存失败”或“发布失败”，而是服务端已经翻译好的开发期提示。

### 5. 补充本地开发提醒

更新：

- `apps/server/README.md`

补了一段最小提醒，告诉后续开发者：

- 默认数据库文件路径
- DB Browser 等 GUI 工具可能导致文件锁
- 服务端虽然会给出更明确提示，但本地排查时优先关闭外部占用工具

## Review 记录

### 是否符合当前 issue 目标

符合。

本轮只处理 SQLite 文件锁导致的开发期错误提示，没有扩展到数据库迁移、重试机制或其他业务逻辑。

### 是否还有可继续抽离的空间

有，但这轮先不做：

- 后续若更多模块开始依赖 SQLite 文件写入，可把这类数据库异常映射继续收敛到更通用的基础设施层
- 如果后面接入远端 libsql / Turso，也可以再补更细的错误分类

当前优先级仍然是先把最常见、最容易误判的问题提示做清楚。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server typecheck`

结果：

- 单元测试通过
- 类型检查通过

## 后续可沉淀为教程的点

- 为什么 SQLite 作为本地开发数据库时容易遇到文件锁
- 为什么教程型项目里“更可读的失败提示”本身就是很重要的工程质量
- 如何用最小异常映射，把底层数据库错误翻译成开发者真正能理解的提示
