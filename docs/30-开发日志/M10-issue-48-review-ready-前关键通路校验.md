# M10 / issue-48 review-ready 前关键通路校验

- Issue：`#87`
- 里程碑：`M10 AI 工作台与真实分析：从基础接口到后台闭环`
- 分支：`fys-dev/feat-m10-issue-48-file-extraction-preview`
- 日期：`2026-03-27`

## 本轮主承诺

把 `apps/server` 已有的文件提取能力接到后台 AI 工作台，形成一条真实可走通的最小链路：

- 管理员上传单个文件
- 后台调用 NestJS `/ai/extract-text`
- 页面预览提取结果或失败信息

本轮不承诺：

- 附件持久化
- 多文件队列
- 真实分析触发
- viewer 真实上传权限收紧

## 关键通路

### 1. 上传到服务端提取通路

要证明的事情：

- 后台不是本地假解析
- 上传真正走到 `apps/server`
- 上传参数、鉴权头和文件体都通过统一客户端发送

证据落点：

- `apps/admin/lib/ai-file-api.ts`
- `apps/admin/lib/ai-file-api.spec.ts`
- `apps/server/test/ai-file-extraction.e2e-spec.ts`

当前结论：

- 已打通。前端通过 `FormData` 调用 `/ai/extract-text`
- `admin` 侧客户端测试已验证请求结构
- `server` 侧 E2E 已验证上传 `txt` 可提取、非法文件会被拒绝

### 2. 后台预览与错误反馈通路

要证明的事情：

- 管理员可以选择受支持文件并发起提取
- 成功后能看到提取结果预览
- 服务端失败时能看到清晰错误，不会卡成静默失败

证据落点：

- `apps/admin/components/ai-file-extraction-panel.tsx`
- `apps/admin/components/ai-file-extraction-panel.spec.tsx`
- `apps/admin/components/admin-ai-workbench-shell.tsx`
- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`

当前结论：

- 已打通。管理端面板支持选择 `txt / md / pdf / docx`
- 成功时展示文件类型、字符数、文本预览
- 失败时展示服务端返回错误
- 工作台壳已接入该面板，并按角色传入 `canUpload`

### 3. 边界与连续性通路

要证明的事情：

- 本轮没有把真实分析、附件历史或双后端逻辑顺手混进来
- 上传闭环接入后不会破坏现有 `admin` 构建和服务端回归

证据落点：

- `apps/admin/components/admin-ai-workbench-shell.tsx`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

当前结论：

- 已满足。页面文案明确写清当前只做到“上传 -> 提取 -> 预览”
- 业务逻辑仍统一落在 `apps/server`
- `admin / server` 相关测试、类型检查和构建均通过

## 是否足以进入 review-ready

可以进入。

原因：

- 本轮主承诺已经完成
- 三条关键通路均有代码与验证证据对应
- 没有提前把下一轮真实分析和附件沉淀混进当前 issue

## 进入 review-ready 前仍需注意

- `viewer` 当前只在前端层做只读提示，服务端更严格的角色限制继续放到后续 issue
- 若下一轮开始接真实分析，需要优先复用本轮的提取结果输入，不要重新发明上传链路
