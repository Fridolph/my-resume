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

如果 Review 发现问题，先回到实现阶段修改，不直接进入自测。

### 7. Review 通过后进行自测

至少完成：

- 类型检查
- 当前任务相关测试
- 构建验证
- 必要的手工验证

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
- 再将该里程碑成果稳定合并到 `development`

### 11. 发布到 `main`

- 仅在阶段性可展示、可部署时进入 `main`

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
- 在 `main` 上直接开发
