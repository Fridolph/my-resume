# GitHub 标准开发流程

本项目采用**教程型渐进开发流程**，目标不是一次性做完，而是让每一步都可讲、可学、可复盘。

## 分支模型

### 长期分支

- `main`：稳定、可展示、可对外说明
- `development`：日常开发主线

### 短期分支

- `feat/*`：功能开发
- `fix/*`：缺陷修复
- `docs/*`：文档和教程
- `chore/*`：工程与配置

## 标准流程

### 1. 先规划里程碑

- 每个里程碑单独定义目标
- 每个里程碑拆出多个 Issue
- 单个 Issue 保持可在 1~2 次提交内清晰说明

### 2. 先建 Issue

Issue 必须包含：

- 背景
- 目标
- 非目标
- 改动范围
- 验收标准
- 测试计划
- 日志输出要求

### 3. 从 `development` 开分支

```bash
git checkout development
git pull origin development
git checkout -b feat/m1-issue-01-workspace-bootstrap
```

### 3.1 AI 功能开发（边做边学）补充流程

- 当前任务若是 AI / RAG / Agent 相关，默认采用“边做边学”模式推进：
  1. 先对齐背景、目标、非目标与验收
  2. 从 `development` 切新 issue 分支
  3. 先做最小设计，再进入实现
  4. 对 AI 交互与核心逻辑补充注释，方法补 TSDoc
  5. 先跑当前改动相关自测，再补开发日志与教程材料
  6. 提交并推送分支，PR 合并回 `development`
  7. `development` 稳定后再进入 `main`
- 若对核心逻辑理解未达预期，先停在设计与伪代码阶段，不直接硬写实现。

### 4. 先 Plan，再做 TDD

- 开始任务前先梳理需求和边界
- 明确要先写哪些测试
- 没有测试策略，不进入实现

### 5. TDD 完成后开始开发

- 实现必须严格围绕当前 Issue
- 不扩展到下一阶段
- 如发现新问题，记录为新 Issue

### 6. 开发完成后先 Review，再自测

Review 阶段必须回答两个问题：

- 是否已经完成并符合当前 Issue 与里程碑目标
- 是否存在可抽离的组件、通用函数、skills 或其他可复用能力

如果当前任务涉及展示层，还必须补充检查：

- 是否支持或至少不阻碍 `light / dark`
- 是否复用 design tokens / 语义化样式，而不是写死颜色与布局
- 是否为后续模板、主题、布局扩展保留了清晰钩子

如果 Review 发现问题，先回到实现阶段修改，不直接进入自测。

### 7. Review 通过后进行自测

至少完成：

- 类型检查
- 当前任务相关测试
- 构建验证
- 必要的手工验证

如果当前任务涉及 UI / 展示，还需要补充：

- `light / dark` 基础切换验证
- 样式在默认模板下无明显耦合或硬编码扩散
- 为后续主题扩展预留的配置点没有被本次实现绕开

如果自测失败，回到前面的实现或 Review 阶段继续修正，直到通过。

### 8. 自测通过后写开发日志

每个 Issue 完成后都要写日志，便于后续博客、教程和分享输出。

### 9. 提交 PR

- 分支推送到远端
- 创建 PR 到 `development`
- 等 CI 通过
- Review 后合并
- 关闭对应 Issue

### 10. 里程碑收束

- 当前里程碑所有 Issue 完成后
- 统一检查文档、日志、变更边界
- 结合该里程碑的提交记录、开发日志和关键设计取舍，整理教程或技术博客
- 如果暂时还不适合直接成文，至少先输出教程 / 博客大纲，避免后续重构打散内容结构
- 再将该里程碑成果稳定合并到 `development`

### 11. 发布到 `main`

- 仅在阶段性可展示、可部署时进入 `main`

### 12. Server 模块类型分层规范（M16 补充）

- `apps/server` 新增功能默认按 `domain / application / transport` 三层管理类型。
- `domain` 只放领域实体与纯业务规则，不放 HTTP 响应包装类型。
- `application` 放用例层输入输出类型（service 编排使用），避免在 service 内重复声明 interface。
- `transport` 放 controller 对外响应 DTO 类型，controller 统一引用 `transport/types`，不在 controller 内临时定义重复响应结构。
- 新模块至少提供模块级 `README`，明确目录职责、类型边界与示例引用路径。

### 13. API Server 模块脚手架规范（M21 补充）

- `apps/server` 下新增目录模块时，**必须先使用 Nest CLI 生成骨架**，禁止直接手写 module/controller/service 起步。
- 统一使用本地命令：

```bash
pnpm --filter @my-resume/server scaffold:module -- <module-name>
```

- 该命令内部会执行：
  - `nest g module modules/<module-name>`
  - `nest g controller modules/<module-name>`
  - `nest g service modules/<module-name>`
- 并补齐模块目录：
  - `__tests__/`
  - `domain/`
  - `application/services/`
  - `infrastructure/repositories/`
  - `transport/controllers/`
  - `transport/dto/`
  - `README.md`
- 若后续需要细化分层，可在该骨架基础上按 Issue 范围增量演进，不做一次性大重构。

## Merge 策略建议

- 功能分支 → `development`：使用 `squash merge`
- `development` → `main`：仅在阶段稳定后进行

## Commit 建议

```txt
feat(m1): bootstrap workspace docs
docs(m1): add monorepo rationale
feat(m2): add auth role model
test(m3): cover publish workflow
```

## 不推荐的做法

- 没有 Issue 就开始改代码
- 一个分支同时做多个里程碑
- 一次性搭完整个 monorepo
- 跳过 Review 直接自测
- 功能没测完就写教程“总结”
- 里程碑结束后不沉淀教程 / 博客大纲，导致后续材料断层
- 在 `main` 上直接开发
