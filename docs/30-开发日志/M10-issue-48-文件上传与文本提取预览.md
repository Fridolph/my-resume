# M10 / issue-48 开发日志：文件上传与文本提取预览

- Issue：`#87`
- 里程碑：`M10 AI 工作台与真实分析：从基础接口到后台闭环`
- 分支：`fys-dev/feat-m10-issue-48-file-extraction-preview`
- 日期：`2026-03-27`

## 背景

`apps/server` 早在 `M4 / issue-14` 就已经具备了 `txt / md / pdf / docx` 的最小文本提取能力，但后台 AI 工作台直到现在还停留在“运行时摘要 + 场景说明”的入口层。

如果后台没有把上传和预览接出来，读者很难感知：

- 服务端文件提取能力真的可用
- 后续真实分析会以什么输入进入
- 为什么“统一由 NestJS 提取文本”仍然重要

所以这一轮只做一件小而关键的事：把“上传 -> 提取 -> 预览”闭环接到后台。

## 本次目标

- 在后台接入单文件上传
- 调用 NestJS `/ai/extract-text`
- 展示提取结果预览与基础错误提示
- 保持当前实现只服务于 AI 工作台输入准备

## 非目标

- 不做附件历史或持久化
- 不做多文件队列
- 不接入真实分析触发
- 不在本轮处理 viewer 的服务端真实上传限制

## TDD / 测试设计

### 1. 先补前端 API 客户端测试

新增：

- `apps/admin/lib/ai-file-api.spec.ts`

先锁定：

- 文件通过 `FormData` 发送到 `/ai/extract-text`
- 鉴权头来自后台 JWT
- 服务端错误会被前端正确抛出，而不是吞掉

### 2. 再补上传预览面板交互测试

新增：

- `apps/admin/components/ai-file-extraction-panel.spec.tsx`

先锁定：

- `viewer` 只能看到只读说明
- `admin` 上传文件后能展示提取预览
- 服务端失败时会出现错误反馈

### 3. 使用现有壳组件测试保护接入

更新：

- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`

重点确认：

- AI 工作台壳已经接入文件提取面板
- `admin / viewer` 仍能走到各自正确的角色分支

### 4. 服务端回归

复用：

- `apps/server/test/ai-file-extraction.e2e-spec.ts`

确认这次前端接入的不是一条“只在前端测试里成立”的假链路。

## 实际改动

### 1. 新增后台文件提取客户端

新增：

- `apps/admin/lib/ai-file-types.ts`
- `apps/admin/lib/ai-file-api.ts`
- `apps/admin/lib/ai-file-api.spec.ts`

这层只负责两件事：

- 定义前端侧使用的提取结果类型
- 以最小客户端形式调用 NestJS `/ai/extract-text`

这样做的好处是，AI 工作台后续不管接真实分析、缓存阅读还是别的入口，都可以继续复用同一条文件提取接入层，而不是把 `fetch` 细节散在组件里。

### 2. 新增 AI 文件上传与预览面板

新增：

- `apps/admin/components/ai-file-extraction-panel.tsx`
- `apps/admin/components/ai-file-extraction-panel.spec.tsx`

当前面板能力保持在最小范围：

- 仅支持单文件上传
- 文件类型限制为 `txt / md / pdf / docx`
- 成功时展示文件类型、字符数和提取文本预览
- 失败时展示错误提示
- `viewer` 只显示只读说明，不显示上传链路

这里刻意没有做“下一步分析”按钮，因为那会把当前 issue 直接拉进真实分析编排。

### 3. 接入 AI 工作台壳

更新：

- `apps/admin/components/admin-ai-workbench-shell.tsx`
- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`

这一步把文件提取能力真正挂到后台工作台里，同时保留角色边界：

- `admin` 可见上传面板
- `viewer` 仅看到只读占位

另外也顺手修正了工作台内的说明文案，避免页面还停留在“本轮只做入口壳”的旧描述。

### 4. 补最小样式承载预览区域

更新：

- `apps/admin/app/globals.css`

只增加当前 issue 真正需要的两类样式：

- 预览区栈式布局
- 文本预览框样式

没有提前把 AI 工作台做成完整附件管理页。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本轮只完成：

- 后台上传接入
- 文本提取预览
- 错误反馈
- 壳组件接入与回归测试

没有越界去做：

- 真实分析触发
- 附件持久化
- 多文件处理
- 新的服务端业务接口

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

本轮已经完成当前最合适的一层抽离：

- `ai-file-api.ts` 负责文件提取请求
- `AiFileExtractionPanel` 负责最小交互界面

暂时不继续往上抽“分析流程编排组件”，因为真实分析、缓存命中、viewer 只读限制都还在后续 issue 中，过早抽大组件只会让边界变糊。

### 本次最重要的边界判断

“统一由 NestJS 做文件提取”依然必须坚持。

原因不是只为了当前后台页面，而是为了后续所有入口都走同一条规则：

- 文件格式支持统一
- 错误提示统一
- 后续移动端或其他前端也能复用
- 不会因为 Next.js 页面层顺手写路由而走向双后端

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-file-extraction.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

结果：

- `admin` 测试、类型检查、构建通过
- `server` 文件提取 E2E、类型检查、构建通过

补充说明：

- `server test:e2e` 当前会顺带执行同配置下的其他 E2E 文件，这是现有 Vitest e2e 配置行为，本轮未改动该配置

## 遇到的问题

### 1. 错误态测试一开始写成了不支持文件类型

问题：

最初测试用了 `csv` 文件来模拟失败，但组件本身就通过 `accept` 限制了只允许 `txt / md / pdf / docx`，测试环境里文件不会真正进入提交链路。

处理：

- 改为上传受支持的 `pdf`
- 由 mock 的服务端响应返回失败信息

这样更贴近真实场景，也更能证明错误反馈链路是活的。

### 2. 页面说明文案容易落后于代码状态

问题：

AI 工作台侧栏还保留着“本轮不展开上传实现”的旧文案，和当前完成状态不一致。

处理：

- 同步更新边界说明
- 明确当前只做到“上传 -> 提取 -> 预览”

## 可沉淀为教程 / 博客的点

- 为什么后台接 AI 时，第一步不是“直接分析”，而是先打通统一输入链路
- 为什么文件提取仍然要放在 NestJS，而不是顺手写在 Next.js 页面层
- 如何用一个小 issue 把服务能力真正接到后台，而不一下子冲进完整 AI 编排
- 前端测试里如何区分“非法输入被控件拦住”与“服务端处理失败”

## 后续待办

- 关闭 `issue-48`
- 继续 `M10` 下一轮真实分析或结果阅读相关任务
- 若后续进入 viewer 更严格边界控制，优先复用本轮上传与提取接口，不重复造入口
