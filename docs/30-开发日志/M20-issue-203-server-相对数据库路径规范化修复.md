# M20 Issue 203 - server 相对数据库路径规范化修复

## 背景
本地 `.env.development.local` 使用 `DATABASE_URL=file:./.data/my-resume.db`。当 server 进程 cwd 在 `apps/server` 时，相对路径会指向 `apps/server/.data/my-resume.db`，导致读到错误库并触发查询失败。

## 本次目标
- 统一规范 `file:` 类型数据库 URL：相对路径解析到仓库根目录
- 避免 cwd 差异导致连接错误数据库

## 实际改动
- `apps/server/src/database/database.config.ts`
  - 新增 `file:` URL 规范化逻辑
  - 相对路径（如 `file:./.data/my-resume.db`）转换为仓库根绝对路径
  - `ensureLocalDatabaseDirectory` 同步支持 query 后缀切分
- `apps/server/src/database/__tests__/database.config.spec.ts`
  - 新增相对 sqlite URL 规范化测试

## 测试与验证
- `pnpm --filter @my-resume/server test src/database/__tests__/database.config.spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- 手工验证：
  - `cd apps/server && DATABASE_URL='file:./.data/my-resume.db' pnpm db:check`
  - 输出已固定到仓库根：`file:/Users/fri/Desktop/personal/my-resume/.data/my-resume.db`

## 后续建议
- 保留 `.env.development.local` 相对写法不变（对开发者更友好）
- server 侧负责收敛并规范化，避免环境差异引发隐式故障
