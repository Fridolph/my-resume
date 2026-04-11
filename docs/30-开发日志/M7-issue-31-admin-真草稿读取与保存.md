# M7 / issue-31 开发日志：admin 真草稿读取与保存

- Issue：#53
- 里程碑：M7 展示层与内容接入：从联调壳到真实页面
- 分支：`feat/m7-issue-31-admin-draft-read-save`
- 日期：2026-03-25

## 背景

`admin` 在此前已经具备最小登录壳、角色识别和发布按钮，但内容管理仍停留在“演示壳”阶段。后端的 `/resume/draft` 已经存在，如果后台还不能真正读取和保存草稿，那么整个管理端就还没有进入真实内容流。

这一步的核心价值，不是一次性做完整后台，而是正式建立：

- 后台编辑的是草稿
- 公开站读取的是已发布内容
- “保存”和“发布”是两个明确分离的动作

## 本次目标

- 在 `admin` 接入 `GET /resume/draft`
- 在 `admin` 接入 `PUT /resume/draft`
- 提供一个最小可用的 profile 编辑面板
- 在界面上明确提示“草稿保存不会自动影响公开站”

## 非目标

- 不做富文本编辑器
- 不做 education / experiences / projects 等完整模块编辑器
- 不做后台 IA 重构和视觉精修
- 不在本次把共享 DTO 抽到 `packages/api-client`

## TDD / 测试设计

先围绕最小闭环补测试：

### 1. API client 测试

新增：

- `apps/admin/lib/resume-draft-api.spec.ts`

覆盖：

- 读取草稿时会请求 `GET /resume/draft`
- 保存草稿时会请求 `PUT /resume/draft`
- 两个请求都必须携带 Bearer Token

### 2. 组件测试

新增：

- `apps/admin/components/resume-draft-editor-panel.spec.tsx`

覆盖：

- admin 可加载并展示当前草稿字段
- 修改 profile 字段后可以保存
- `viewer` / 无编辑权限账号只显示只读提示，不进入真实编辑流

这样设计的原因是：本次任务关注的是“后台是否真正进入草稿编辑态”，而不是完整内容模块或复杂表单体验。测试应该直指草稿读取、保存和权限边界。

## 实际改动

### 1. 补充 admin 侧简历类型与 API client

新增：

- `apps/admin/lib/resume.types.ts`
- `apps/admin/lib/resume-draft-api.ts`

这里先在 `admin` 本地定义最小类型，目的不是长期重复维护，而是让当前 issue 先形成可讲清楚、可运行的闭环。后续如果 `web/admin/server` 的契约继续增多，再在单独 issue 中抽到共享包。

### 2. 新增最小草稿编辑面板

新增：

- `apps/admin/components/resume-draft-editor-panel.tsx`

本次只开放 `profile` 模块编辑：

- 中文 / 英文姓名
- 中文 / 英文标题
- 中文 / 英文所在地
- 中文 / 英文简介
- 邮箱 / 电话 / 网站

这样做有两个好处：

- 用户已经可以真实读取与保存草稿
- 同时不会因为一次性铺开所有模块而破坏教程节奏

保存时仍提交完整 `StandardResume`，只是未编辑模块沿用草稿中的原值。

### 3. 将草稿编辑面板挂到后台控制台

更新：

- `apps/admin/components/admin-dashboard-shell.tsx`

现在登录后的后台顺序变成：

- 用户与角色信息
- 草稿编辑面板
- 发布 / AI 动作
- 导出入口

这让后台首次具备“真实内容入口”的意义，而不是只有权限演示。

### 4. 补充最小样式支撑

更新：

- `apps/admin/app/globals.css`

补了 `textarea` 与 `form-grid` 的基础样式，保持当前界面简单可用，同时不阻碍后续主题和布局升级。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只做了 `admin` 草稿读取与保存的最小闭环，没有扩展到：

- 旧版 Vue 简历迁移
- web 真实模块化渲染
- 后台完整信息架构
- DTO 共享包抽离

### 是否可抽离组件、公共函数、skills 或其他复用能力

已做的最小抽离：

- 草稿请求收敛为 `resume-draft-api.ts`
- 简历契约收敛为 `resume.types.ts`
- 草稿编辑面板独立为 `ResumeDraftEditorPanel`

当前没有继续把表单字段再抽成更小组件，因为只有一个最小 profile 面板，过早拆分会增加教程理解成本。

### 这次最重要的边界判断

后台编辑态已经接通，但“保存草稿”仍然不等于“公开发布”。

这条边界不只是接口语义，也是教程里的核心设计点：

- 如果保存后自动影响公开站，发布流就失去意义
- 如果后台不能保存草稿，管理端又不算真实内容入口

本次正是把这条边界正式立住。

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin build`

结果：全部通过。

补充说明：构建阶段出现了现有 Tailwind `content` 配置告警，但不影响本次功能和构建结果；该告警属于后续样式基建整理项，不在当前 issue 范围内。

## 遇到的问题

### 1. 简历类型当前还未共享

问题：`admin` 需要了解 `StandardResume` 结构，但当前 `packages/api-client` 还没有真正承载共享契约。

处理：

- 本次先在 `admin` 本地定义最小类型镜像
- 保持 issue 范围集中
- 后续等共享契约足够稳定后，再单独抽离

### 2. 只做最小编辑面板，如何避免“半成品感”

问题：如果一次性只开放 profile 字段，容易让人误解后台能力不完整。

处理：

- 在界面上明确写清“当前先接通 profile 编辑，其余模块沿用原草稿”
- 把这次定位成“内容流闭环建立”，而不是“后台已全部完成”

## 可沉淀为教程/博客的点

- 为什么教程型后台应该先打通“草稿保存”再谈复杂编辑器
- 后台编辑态与公开发布态为什么必须分离
- 在 monorepo 早期，什么时候先本地定义类型，什么时候再抽共享契约

## 后续待办

- 继续推进 `M7 / issue-32`：旧版简历内容迁移到标准模型
- 或按当前拆解节奏推进 `M7 / issue-33`：web 公开简历页面模块化渲染
- 等 M7 收束后，再补里程碑级教程大纲或正文
