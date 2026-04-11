# M16 / issue-172：api-client 官方 hooks 与 alova skill 收口

## 背景

- `packages/api-client` 早期为了兼容不同调用方式，引入了 `adapters`、`errors`、`policy` 等额外运行时封装。
- 随着 `web/admin` 两端逐步统一到 `alova` 官方推荐的 `createMethod(...).send()` 与官方 hooks，这层兼容包装开始变成阅读与维护负担。
- 同期仓库内也需要沉淀一份可复用的 alova 使用说明，方便后续继续按教程节奏推进。

## 本次目标

- 只收口 `packages/api-client` 的请求组织方式与类型定义。
- 删除已不再需要的运行时兼容层，回到更贴近官方文档的 method-first 模式。
- 补充 repo 内部的 alova skills 文档，作为后续协作与教学材料。

## 实际改动

- `client.ts` 改为围绕 `createAlova` 与统一 method 工厂组织：
  - 保留基础实例配置
  - 精简错误与响应处理分支
  - 将请求使用面统一到 `Method.send()` 语义
- 删除旧兼容层文件：
  - `src/client/adapters.ts`
  - `src/client/errors.ts`
  - `src/client/policy.ts`
- `auth.ts`、`ai.ts`、`resume.ts` 改为直接返回更清晰的 method / send 链路。
- `types/*` 同步清理不再使用的策略与包装类型，降低调用方心智负担。
- `client.spec.ts` 与新增的 `ai.spec.ts` 调整为围绕官方调用方式断言。
- 新增仓库本地技能文档：
  - `skills/alova-client-usage`
  - `skills/alova-server-usage`
- `README.md` 与 `pnpm-lock.yaml` 同步更新，保持依赖与文档一致。

## Review 记录

- 本轮只处理 api-client 组织方式与技能文档，不扩展到 server/BFF 设计重构。
- 不改后端接口契约，不新增新的领域抽象层。
- 优先选择“更接近官方文档、后续更易教学”的实现，而不是保留历史兼容包袱。

## 遇到的问题

- `api-client` 被 `web/admin` 两端同时依赖，清理兼容层时必须保证调用签名与类型导出不出现连锁回归。
- `alova` 的官方 hooks 与 method 调用方式需要和现有测试 mock 对齐，否则容易出现用例与真实调用语义不一致。

## 测试与验证

- 计划验证：
  - `pnpm --filter @my-resume/api-client build`
  - `pnpm --filter @my-resume/api-client test`
  - `pnpm --filter @my-resume/web typecheck`
  - `pnpm --filter @my-resume/admin typecheck`
- 实际验证：
  - 待本次分组提交后统一执行并记录结果。

## 后续可写成教程/博客的切入点

- 为什么在 monorepo 渐进重构里，要主动删除“看起来更通用”的请求兼容层。
- alova 在前端 app 与 server/BFF 场景下，如何分别建立清晰的使用约定。
- 如何把“请求客户端收口”与“团队/AI 协作技能沉淀”放在同一个教学里程碑里推进。
