# M3-issue-10-双语内容模型

## 标题

- Issue：`#19`
- 里程碑：`M3 简历内容与发布流`
- 分支：`feat/m3-issue-10-bilingual-content-model`
- 日期：`2026-03-25`

## 背景

`M3` 的第一步不是直接接数据库、CRUD 或发布流，而是先把“标准双语简历”这件事的领域边界定义清楚。

如果内容模型一开始就不稳定，后面无论是后台编辑、公开展示、发布态，还是导出与 AI 分析，都会被反复牵连。对于教程型项目来说，先把数据骨架讲清楚，也更适合读者逐步理解系统是如何长出来的。

## 本次目标

- 为标准版简历建立清晰、稳定的双语内容模型。
- 明确 v1 简历模块边界，为后续 CRUD 与发布流做准备。
- 用测试先锁定运行时约束，避免后续结构随意漂移。

## 非目标

- 不接数据库。
- 不做简历 CRUD 接口。
- 不做草稿 / 发布态。
- 不做导出、AI、JD 定制版能力。

## TDD / 测试设计

- 先验证标准简历的模块边界是否稳定。
- 先验证空白简历骨架是否默认包含 `zh/en` 双语结构。
- 先验证 `LocalizedText` 是否保持严格的双语字段约束。
- 先验证一个完整示例数据是否能通过校验。
- 先验证非法内容结构是否会被识别并返回明确错误。

这样做的目的，是先把“什么是合法的标准双语简历”讲清楚，再去写后面的存储和接口。

## 实际改动

- 新增 `apps/server/src/modules/resume/domain/standard-resume.ts`
  - 定义 `StandardResume`、`LocalizedText` 以及各模块内容结构。
  - 提供空白骨架工厂 `createEmptyStandardResume()`。
  - 提供示例数据工厂 `createExampleStandardResume()`。
  - 提供基础运行时校验函数 `validateStandardResume()`。
- 新增 `apps/server/src/modules/resume/domain/standard-resume.spec.ts`
  - 通过测试锁定模块边界、双语骨架和校验规则。
- 新增 `apps/server/src/modules/resume/resume.module.ts`
  - 为后续 `M3` 的 CRUD、发布流和内容服务预留模块边界。
- 更新 `apps/server/src/app.module.ts`
  - 将 `ResumeModule` 接入主应用。

## Review 记录

- 是否符合当前 Issue 与里程碑目标：符合。
  - 当前只完成“标准双语内容模型”这一层，没有提前引入数据库、接口或发布态。
- 是否存在可抽离的公共能力：有，但本次暂不扩张。
  - `LocalizedText` 与校验函数后续可逐步抽为更通用的内容建模工具。
  - 当前阶段保持在 `resume/domain` 内部，更利于教程讲解和读者理解。
- 是否存在范围膨胀：没有。
  - 明确没有引入 `resume_variant`、JD 定制版、多模板或导出逻辑。

## 自测结果

- 类型检查：通过
  - `pnpm run typecheck`
- Server 单元测试：通过
  - `pnpm --filter @my-resume/server exec jest --runInBand`
- Server E2E：通过
  - `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand`
  - 有 `Jest did not exit one second after the test run has completed` 提示，当前不影响通过，后续可单独排查 open handles。
- 构建验证：通过
  - `pnpm --filter @my-resume/server build`
  - `pnpm run build`

## 遇到的问题

- 问题：如何在教程节奏下控制 `M3` 的范围，避免一上来就把数据表、接口、发布态全部铺满。
- 解决方式：把本期聚焦为“领域模型 + 测试约束 + 模块边界”，其余内容拆到后续 Issue。

## 可沉淀为教程/博客的点

- 为什么双语简历项目应该先定义内容模型，再接数据库。
- `LocalizedText` 这种字段级双语结构为什么比后期补丁式国际化更稳。
- 教程型项目中，如何用 TDD 先锁定领域边界，而不是直接写接口。

## 后续待办

- 继续 `M3` 后续 Issue，例如草稿 / 发布态设计与内容读写流程。
- 后续补齐数据库表结构、内容服务与公开站读取路径。
