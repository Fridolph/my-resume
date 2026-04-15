# server 10 分钟主链路速读

本文目标：在 `10` 分钟内建立一条完整脑图，先能讲清楚“数据怎么流动”，再深入细节。

建议你开着编辑器按顺序跳文件，不需要一次读完全部实现。

## 0-2 分钟：先看启动与模块装配

1. `apps/server/src/main.ts`
2. `apps/server/src/app.module.ts`
3. `apps/server/src/database/database.module.ts`

你要拿到的结论：

- `main.ts` 只做启动，不放业务逻辑。
- `AppModule` 把 `Auth / Resume / Ai` 三条线挂起来。
- `DatabaseModule` 统一注入数据库实例，业务层不自己拼连接。

## 2-4 分钟：看登录与权限守卫

1. `apps/server/src/modules/auth/auth.controller.ts`
2. `apps/server/src/modules/auth/auth.service.ts`
3. `apps/server/src/modules/auth/guards/jwt-auth.guard.ts`
4. `apps/server/src/modules/auth/guards/role-capabilities.guard.ts`

你要拿到的结论：

- 登录得到 `accessToken + capabilities`。
- 请求先过 `JwtAuthGuard`（身份），再过 `RoleCapabilitiesGuard`（能力）。
- 后续 `resume`、`ai` 都复用这一套守卫模型。

## 4-7 分钟：看简历数据主链路（最关键）

1. `apps/server/src/modules/resume/resume.controller.ts`
2. `apps/server/src/modules/resume/resume-publication.service.ts`
3. `apps/server/src/modules/resume/resume-publication.repository.ts`
4. `apps/server/src/database/schema.ts`

你要拿到的结论：

- `draft` 和 `published` 是两层视图，不是同一个状态位。
- `PUT /resume/draft` 只更新草稿位。
- `POST /resume/publish` 会追加一条发布快照。
- `GET /resume/published` 读取最新发布快照（按 `publishedAt` 倒序）。

## 7-9 分钟：看 web 端为什么刷新就更新

1. `apps/web/app/page.tsx`
2. `apps/web/app/profile/page.tsx`
3. `apps/web/app/ai-talk/page.tsx`
4. `packages/api-client/src/resume.ts`

你要拿到的结论：

- 页面渲染时会调用 `fetchPublishedResume`。
- 该请求使用 `cache: 'no-store'`，刷新会重新向 `server` 拉最新数据。
- 不是实时推送，而是“刷新触发重新请求 + 读取最新快照”。

## 9-10 分钟：只做一个连线检查

把这条线完整复述一遍：

1. `admin` 点击发布
2. `POST /resume/publish`
3. `server` 新增发布快照
4. `web` 刷新
5. `GET /resume/published`
6. 返回最新快照并渲染

如果你能顺讲这 6 步，说明主链路已经真正吃透了。

## 下一步建议（可选）

- 然后再读：`docs/60-源码拆解/02-server-关键链路时序图.md`
- 再然后才进入：`apps/server/src/modules/ai/`（避免认知过载）
