# apps/admin

`apps/admin` 是后台管理端的最小 Next.js App Router 应用。

## 当前阶段职责

- 承接最小登录页
- 调用 `apps/server` 的 `/auth/login` 与 `/auth/me`
- 提供最小受保护页面壳

## 当前阶段不做

- 不实现完整后台 UI
- 不接内容管理
- 不在 Next Route Handlers 中编写业务逻辑
