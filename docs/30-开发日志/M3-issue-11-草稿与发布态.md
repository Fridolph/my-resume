# M3-issue-11-草稿与发布态

## 标题

- Issue：`#20`
- 里程碑：`M3 简历内容与发布流`
- 分支：`feat/m3-issue-11-publish-status`
- 日期：`2026-03-25`

## 背景

双语内容模型完成后，后台编辑态和公开展示态需要被明确拆开。否则草稿内容会和公开展示混在一起，后续 `web` 端也无法稳定只读取“已发布版本”。

## 本次目标

- 建立最小草稿 / 已发布状态。
- 支持后台更新草稿。
- 支持最小发布动作，并让公开接口只读取已发布内容。

## 非目标

- 不接数据库。
- 不做版本历史和回滚。
- 不做多人协作。
- 不接 `apps/web` 页面展示。

## TDD / 测试设计

- 先用服务单测锁定草稿与已发布快照的切换行为。
- 先用 E2E 锁定公开读取、管理员发布、viewer 只读三个关键场景。
- 先验证“改草稿不会立刻改公开内容”，确保状态边界不漂移。

## 实际改动

- 新增 `apps/server/src/modules/resume/resume-publication.service.ts`
  - 用内存态管理 `draft` 与 `published` 快照。
- 新增 `apps/server/src/modules/resume/resume.controller.ts`
  - 提供 `GET /resume/published`
  - 提供 `GET /resume/draft`
  - 提供 `PUT /resume/draft`
  - 提供 `POST /resume/publish`
- 更新 `apps/server/src/modules/resume/resume.module.ts`
  - 接入控制器、服务与鉴权模块。
- 新增服务单测与 E2E
  - `apps/server/src/modules/resume/resume-publication.service.spec.ts`
  - `apps/server/test/resume-publication.e2e-spec.ts`

## Review 记录

- 是否符合当前 Issue 与里程碑目标：符合。
  - 当前只做最小发布闭环，没有提前引入数据库和回滚逻辑。
- 是否存在可抽离的公共能力：有。
  - 后续可把 `draft/published` 快照与持久化抽成独立仓储层。
  - 当前先保留在 `resume` 模块内部，更适合教程节奏。
- 是否存在范围膨胀：没有。
  - 未进入 `web`、导出、AI 或多版本简历能力。

## 自测结果

- 服务单测：通过
  - `pnpm --filter @my-resume/server exec jest --runInBand src/modules/resume/resume-publication.service.spec.ts`
- 目标 E2E：通过
  - `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/resume-publication.e2e-spec.ts`
- Server 全量单测：通过
  - `pnpm --filter @my-resume/server exec jest --runInBand`
- Server 全量 E2E：通过
  - `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand`
- Server 构建：通过
  - `pnpm --filter @my-resume/server build`

## 遇到的问题

- 问题：`NestJS` 在 `emitDecoratorMetadata` 打开时，装饰器签名里引用类型会要求 `import type`。
- 解决方式：将 `StandardResume` 改为类型导入，避免 `TS1272` 构建错误。

## 可沉淀为教程/博客的点

- 为什么简历类项目要先做草稿 / 发布态，再做公开展示。
- 如何用最小内存态服务先跑通发布闭环，再渐进替换成数据库。
- `viewer` 只读角色为什么要在发布接口层面继续生效。

## 后续待办

- 继续 `M3 / issue-12`，让 `apps/web` 只读取已发布版本。
- 后续把当前内存态发布流迁移到数据库持久化。
