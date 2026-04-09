# M12 / issue-132 开发日志：admin AI 工作台布局与测试目录规范

- 里程碑：`M12 开源版收尾与智能简历改写`
- Issue：`#132 [Chore] M12 / issue-132 admin AI 工作台布局收口与测试目录规范`
- 分支：`fys-dev/feat-m12-issue-132-admin-ai-workbench-layout-closeout`

## 背景

前一轮我们已经把 `apps/admin` 的 AI 工作台做成了可用的新布局，但这次改动没有先挂到对应 issue，上线前缺了一段标准流程记录。

同时，`apps/admin` 下的测试文件仍然散落在组件和 `lib` 同级目录中。随着后台 UI 与 AI 工作台继续增长，这种组织方式会越来越不利于阅读、迁移和维护。

所以这轮不继续扩功能，而是做一次“流程补完 + 目录收口”：

1. 为 admin AI 工作台布局调整补齐标准 issue
2. 把 `apps/admin` 的测试统一迁移到 `__tests__/`
3. 修掉迁移后暴露出来的测试清理问题
4. 用完整的 `typecheck / test / build` 作为本轮结束验证

## 本次目标

- 补建 GitHub issue，确保这轮改动能被标准流程追踪
- 保留本轮 AI 工作台的“双栏工作区”布局，不再回退成多列卡片拼装
- 将组件测试统一迁移到 `apps/admin/components/__tests__/`
- 将公共模块测试统一迁移到 `apps/admin/lib/__tests__/`
- 更新仓库协作规则，明确后续测试文件默认目录约定

## 非目标

- 不新增后端接口
- 不改 AI 报告契约
- 不扩展新的后台页面
- 不处理与本轮无关的 `apps/web` 与 `apps/server` 其他功能

## 实际改动

### 1. 补建了本轮对应 Issue

已创建：

- `#132 [Chore] M12 / issue-132 admin AI 工作台布局收口与测试目录规范`

本轮开始补齐后续流程，避免“功能做了，但过程不可追踪”。

### 2. 保留并收住 AI 工作台新布局

保留了前一轮已完成的两个核心改动：

- `dashboard/ai` 页面改成按行组织，而不是旧的左右大列拼装
- 中间核心工作区使用双栏布局：
  - 左侧聚焦文件提取、文本输入、场景选择与触发动作
  - 右侧聚焦当前报告概览、结论摘要、判断依据、风险提示与建议动作

这一版更接近真实工作台，也更方便后续继续长出 RAG、上下文对比和应用前确认。

### 3. 统一迁移 admin 测试目录

本轮把 `apps/admin` 中已有测试迁移到了统一目录：

- `apps/admin/components/__tests__/`
- `apps/admin/lib/__tests__/`

迁移后同步修正了：

- 组件测试对实现文件的相对路径
- 组件测试对 `lib/*` 的引用路径
- 公共测试对同层模块的引用路径
- `admin-protected-layout` 测试中的清理逻辑

### 4. 补充仓库测试目录约定

在 `AGENTS.md` 中新增“测试文件约定”：

- 页面 / 组件测试默认进入对应目录下的 `__tests__/`
- 公共模块、客户端请求层、领域函数测试也统一进入各自目录下的 `__tests__/`

这样后续继续推进时，不需要每轮再重新讨论“spec 放哪儿”。

## Review 记录

本轮 Review 主要检查了三件事：

1. 这次提交是否仍然只围绕 admin AI 工作台布局收口和测试目录规范
2. 新的测试目录层级是否已经统一，不再一半同级、一半 `__tests__/`
3. 全量 `admin` 自测是否真正可作为收尾门禁，而不是只靠定向测试

Review 结论：

- 范围可控，没有扩展到新的业务能力
- 目录规范已统一落地
- 通过补清缓存与测试清理，`typecheck / test / build` 已全部恢复

## 遇到的问题

### 1. `typecheck` 被旧的 `.next` 类型缓存影响

迁移测试文件后，`pnpm --filter @my-resume/admin typecheck` 一度报 `.next/types/**/*.ts` 缺失。

最终处理：

- 清理 `apps/admin/.next/types`
- 清理 `apps/admin/tsconfig.tsbuildinfo`
- 重新执行 `next typegen && tsc --noEmit`

说明本轮问题不是业务代码本身错误，而是旧缓存没有及时刷新。

### 2. `admin-protected-layout` 测试在 teardown 后抛出 `window is not defined`

之前全量 `admin test` 会出现测试通过但 teardown 有未处理异常的情况。

本轮处理：

- 在对应 spec 中补上显式 `cleanup()`
- 让该测试在全量执行时也能稳定收口

## 测试与验证

本轮完成后，执行：

- `pnpm --filter @my-resume/admin typecheck` ✅
- `pnpm --filter @my-resume/admin test` ✅
- `pnpm --filter @my-resume/admin build` ✅

额外确认：

- `apps/admin/components/__tests__/` 已承载页面 / 组件测试
- `apps/admin/lib/__tests__/` 已承载公共测试
- `dashboard/ai` 的双栏工作区布局保留生效

## 后续可写成教程 / 博客的切入点

- 为什么“做完功能”之后还要补一次 issue、日志与目录收口
- 前端项目里测试文件为什么适合统一放进 `__tests__/`
- 当 Next.js 的 `.next` 类型缓存干扰 `typecheck` 时，应该如何判断是缓存问题还是代码问题
- UI 收口阶段如何把“可用页面”继续整理成“可维护工作台”
