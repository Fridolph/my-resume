# M12 / issue-131 开发日志：web 公开简历两栏布局与经历项目编辑

- Issue：`#131`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/feat-m12-issue-131-web-and-resume-editor-closeout`
- 日期：`2026-04-03`

## 背景

`apps/web` 已经具备公开简历读取与导出能力，但阅读节奏还没有真正贴近旧版 Vue 简历站的“左信息栏 / 右内容流”结构。

与此同时，`apps/admin` 的草稿编辑能力还主要停留在 `profile`，对于工作经历和项目经历这类高频维护内容，后台还没有最小可用的编辑入口。

这轮的目标不是做完整 CMS，而是把公开展示与后台编辑同时向“标准简历站”的最低可用闭环推进半步。

## 本次目标

- 让 `apps/web` 的公开简历页面回到更接近旧版的双栏阅读节奏
- 让 `apps/admin` 至少支持工作经历与项目经历的核心字段编辑
- 保持 `StandardResume` 契约不变，不新增额外内容模型
- 保证草稿保存、公开发布读取和现有导出链路不被破坏

## 非目标

- 不重做 web 展示端的整套视觉设计语言
- 不扩展教育、技能、亮点到完整 CMS 级编辑器
- 不新增 server 接口或调整 DTO
- 不引入新的模板系统或 JD 变体能力

## 实际改动

### 1. web 公开页调整为左侧信息栏 + 右侧内容流

更新：

- `apps/web/components/published-resume-shell.tsx`
- `apps/web/app/globals.css`

这轮把页面收成：

- 左侧栏：个人信息、教育、技能、亮点
- 右侧栏：公开简历速览、工作经历、项目经历

同时为桌面端补上 sticky 侧栏，让阅读节奏更接近旧版简历站；移动端继续保持自然上下流式布局。

### 2. admin 草稿编辑器补齐工作经历与项目经历

更新：

- `apps/admin/components/resume-draft-editor-panel.tsx`

这轮在保留 `profile` 编辑的基础上，新增了：

- 工作经历：公司、岗位、类型、时间、地点、摘要、亮点、技术栈
- 项目经历：名称、角色、时间、摘要、亮点、技术栈

这里仍坚持“最小但可用”的策略，没有引入富文本、复杂排序或模块化内容编排。

### 3. 修正多值字段的真实编辑体验

补充处理：

- 为技术栈和亮点这类“字符串输入 -> 结构化数组”的字段增加原始输入缓存

原因是，如果直接把逗号分隔和换行分隔字段做成完全受控并即时格式化，用户在输入过程中会遇到：

- 逗号被吞掉
- 换行被折叠
- 输入体验与保存结果不一致

因此这轮改成：

- 输入时保留原始文本
- 同步映射为结构化数据
- 保存后再按结构化数据回填

这样既保留了后台编辑的可读性，也避免了表单控件在输入过程中“抢格式”的问题。

### 4. 补齐测试目录规范与新用例

更新：

- `apps/admin/components/__tests__/resume-draft-editor-panel.spec.tsx`
- `apps/web/components/__tests__/published-resume-shell.spec.tsx`
- `apps/web/lib/__tests__/published-resume-api.spec.ts`

这轮顺手把 web 端相关测试收进 `__tests__` 目录，并新增验证：

- admin 端确实能提交经历 / 项目核心字段
- web 端移动后的测试路径仍可正常运行

## Review 记录

### 是否符合当前 issue 目标

符合。

这轮只围绕：

- 公开简历展示节奏
- 后台经历 / 项目最小编辑能力

没有继续扩展到新的路由、DTO、模板或额外 AI 场景。

### 是否存在继续抽离的空间

有，但当前不继续做：

- 经验 / 项目表单片段后续可以继续抽成复用子组件
- 多值字段的输入适配逻辑后续可以提炼成公共表单工具
- web 端的左栏卡片后续可以继续沉淀到 `packages/ui`

当前优先级仍然是先把 `#131` 的真实主线闭环收住。

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/web build`

结果：

- admin 类型检查通过
- admin 单元测试通过
- admin 构建通过
- web 类型检查通过
- web 单元测试通过
- web 构建通过

备注：

- `apps/web` 构建仍会提示 Tailwind `content` 配置为空的已有 warning，本轮未扩展处理，后续如继续收 web 样式基线可单开 issue。

## 后续可沉淀为教程的点

- 为什么教程型重构里，先补“最常修改的经历 / 项目”比先做完整表单更合适
- 为什么公开简历页更接近旧版阅读节奏时，先收布局骨架比先做视觉细节更重要
- 多值字段在后台表单里为什么不能简单“边输入边格式化”
