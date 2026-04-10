# AGENTS.md

本文件定义本仓库后续协作与开发的默认规则，作用域为整个仓库。

## 项目当前阶段

- 当前仓库仍以旧版 `Vue3 + Vite` 简历站为主。
- `Monorepo` 重构处于**教程型渐进重构阶段**。
- 后续开发必须按**里程碑 → Issue → 分支 → Plan → TDD → 实现 → Review → 自测 → 日志 → PR/CI → 合并**推进。
- **禁止**一次性把整个目标架构全部铺满，避免失去教程节奏与过程感。

## 核心协作原则

- 所有改动必须围绕**当前 Issue**，禁止顺手扩展多个里程碑范围。
- 每次任务开始前，先梳理目标、边界、风险和验收标准。
- 优先小步提交、可验证、可回滚、可写教程。
- 若存在多种方案，优先选择更适合教学、更容易解释的方案，而不是一次性最“完整”的方案。
- 若发现当前 Issue 过大，应先拆分，而不是硬做。

## 标准开发流程

### 1. 先规划里程碑

- 根据总方案维护里程碑列表。
- 每个里程碑都要有明确目标、边界、输入、输出、验收标准。
- 每个里程碑拆成多个小 Issue，保持单一职责。

### 2. 先有 Issue，再写代码

- 每个开发任务必须先有 Issue。
- Issue 至少包含：
  - 背景
  - 目标
  - 非目标
  - 改动范围
  - 验收标准
  - 测试计划
  - 日志/教程输出要求

### 3. 分支规范

- 永远从 `development` 开分支。
- 禁止直接在 `main` 上开发。
- 分支命名建议：
  - `feat/m1-issue-01-workspace-bootstrap`
  - `feat/m2-issue-03-auth-login`
  - `fix/m3-issue-08-publish-status`
  - `docs/m1-issue-02-architecture-notes`
  - `chore/m1-issue-04-ci-bootstrap`

### 4. 先 Plan，再 TDD，再实现

- 开始任务前先梳理需求与改动范围。
- 先写测试设计，再实现代码。
- 没有明确测试策略时，不进入实现阶段。

### 5. 开发中必须控制范围

- 只处理当前任务相关内容。
- 不主动修 unrelated bug。
- 如发现更大问题，记录到新 Issue，不在当前任务里扩张。

### 6. 开发完成后先 Review

- Review 必须检查：
  - 是否符合当前 Issue 与里程碑目标
  - 是否存在可抽离的组件、公共函数、skills 或其他复用能力
- 若 Review 未通过，先回到实现阶段继续修改。

### 7. Review 通过后进行自测

- 至少执行当前任务涉及的：
  - 类型检查
  - 单元测试
  - 构建验证
  - 关键人工验证
- 若自测未通过，回到前面的实现或 Review 阶段继续修改。

### 8. 必须写开发日志

- 每完成一个 Issue，都要补一份开发日志。
- 日志至少包含：
  - 背景
  - 本次目标
  - 实际改动
  - Review 记录
  - 遇到的问题
  - 测试与验证
  - 后续可写成教程/博客的切入点

### 9. 提交与合并

- Commit 使用清晰、可追踪的 message。
- 推荐格式：
  - `feat(m1): bootstrap workspace docs`
  - `feat(m2): add auth role model`
  - `docs(m1): add monorepo rationale`
  - `test(m3): cover publish flow`
- PR 合并到 `development` 前必须通过 CI。
- 一个里程碑内的多个任务完成后，再按顺序合并到 `development`。
- `main` 只接受阶段性稳定内容。

## Git Flow 约定

- 长期分支：
  - `main`：稳定、可展示、可对外说明
  - `development`：当前开发主线
- 短期分支：
  - `feat/*`
  - `fix/*`
  - `docs/*`
  - `chore/*`
- 里程碑结束时：
  - 先确保对应 Issue 全部关闭
  - 结合该里程碑的提交、开发日志与关键设计决策，整理教程或技术博客
  - 如果内容暂时还不够完整，至少先产出教程 / 博客大纲，避免后续重构时结构散乱
  - 再把该里程碑分支内容整理合并到 `development`
  - 稳定后再从 `development` 进入 `main`

## 文档要求

- 文档导航记录在 `docs/00-文档导航.md`
- 总方案记录在 `docs/10-架构设计/01-个人简历-monorepo-重构总方案-v1学习版.md`
- GitHub 开发流程记录在 `docs/20-研发流程/01-GitHub-标准开发流程.md`
- 里程碑与 Issue 拆解记录在 `docs/20-研发流程/02-里程碑与-Issue-拆解建议.md`
- 开发日志模板记录在 `docs/20-研发流程/03-开发日志模板.md`
- 每个任务的开发日志放在 `docs/30-开发日志/`
- 里程碑级教程 / 博客正文或大纲放在 `docs/40-教程与博客/`

## 测试文件约定

- 新增测试文件时，优先放在对应目录下的 `__tests__/` 子目录中。
- 页面 / 组件测试示例：
  - `apps/admin/modules/<feature>/__tests__/xxx.spec.tsx`
  - `apps/web/components/__tests__/xxx.spec.tsx`
- 公共模块、客户端请求层、领域函数等测试示例：
  - `apps/admin/modules/<feature>/__tests__/xxx.spec.ts`
  - `apps/admin/core/**/__tests__/xxx.spec.ts`
  - `apps/server/src/**/__tests__/xxx.spec.ts`
- 避免再把 `.spec.ts` / `.spec.tsx` 直接散落在实现文件同级目录，除非当前目录结构确实无法自然承载 `__tests__/`。

## TSX 类型拆分约定

- `apps/admin` 继续按模块自治推进，优先落在 `apps/admin/modules/<feature>/` 下，每个模块至少维护自己的 `README.md`、`__tests__/` 与 `types/`。
- 当一个 `tsx` 文件**超过 200 行**，且文件内显式声明的 `interface` / `type` **超过 2 个**时，必须把这些类型抽到对应模块的 `types/` 目录中。
- `import type { ... }` 不计入这个阈值，只统计文件内真实声明的类型。
- `types` 文件命名统一使用 `.types.ts` / `.types.tsx`，不再新增 `-types.ts` / `-types.tsx`。
- 若本轮任务会显著修改该 `tsx` 文件，应顺手完成类型拆分，而不是继续把类型堆回组件文件中。
- `apps/admin/modules/**` 下的实现文件不再把业务专属类型放回相邻目录或全局收纳箱，优先从当前模块的 `types/` 引用。
- 根目录 `pnpm check:tsx-types` 会对当前改动中的 `tsx` 文件执行这条规则检查；对 `apps/admin/modules/**` 会优先校验模块内 `types/` 文件。

## 后续实现方向约束

- 目标架构是：
  - `apps/web`
  - `apps/admin`
  - `apps/server`
  - `packages/ui`
  - `packages/api-client`
  - `packages/config`
- 但必须**按里程碑渐进落地**，不能一步到位。

## AI 协作约束

- 每次任务默认先说明：
  - 当前目标
  - 当前只做什么
  - 当前明确不做什么
- 如果任务开始偏离教学节奏，应主动提醒并建议拆分。
