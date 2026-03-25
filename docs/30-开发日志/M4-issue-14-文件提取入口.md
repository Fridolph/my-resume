# M4 / issue-14 文件提取入口

- Issue：`#23`
- 里程碑：`M4 AI 工具链：Mock 到真实 Provider`
- 分支：`feat/m4-issue-14-file-extraction`
- 日期：`2026-03-25`

## 背景

在进入 JD 匹配、简历建议、offer 对比这些 AI 能力之前，系统必须先拿到可靠的文本输入。  
如果没有统一的文件提取入口，后续每个分析接口都要重复处理上传、格式识别、错误反馈和解析逻辑，结构会很快发散。

这一轮先只做最小可用能力：支持常见文本型简历文件上传，并统一返回提取后的纯文本结果。

## 本次目标

- 提供统一的文件提取接口
- 支持 `txt / md / pdf / docx`
- 返回标准化纯文本结果
- 对不支持的文件类型给出明确错误
- 补齐服务层单测与接口级 E2E

## 非目标

- 不做 OCR
- 不做云存储
- 不做队列调度
- 不做 AI 分析任务
- 不在这一轮区分 `admin / viewer` 的 AI 能力边界

## TDD / 测试设计

### 服务层单测

新增 `apps/server/src/modules/ai/file-extraction.service.spec.ts`，先锁定：

- `txt` 可直接读取文本
- `md` 保留原始 Markdown 内容
- `pdf` 可得到提取文本
- `docx` 可得到提取文本
- 不支持的扩展名会抛出异常

### 接口级 E2E

新增 `apps/server/test/ai-file-extraction.e2e-spec.ts`，锁定：

- 登录后可上传 `txt` 并获取文本结果
- 上传 `csv` 等不支持类型时返回 `400`

## 首次失败记录

### 1. 文件提取服务不存在

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai/file-extraction.service.spec.ts`
- 结果：失败
- 原因：缺少 `FileExtractionService`

### 2. 文件上传接口不存在

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/ai-file-extraction.e2e-spec.ts`
- 结果：失败
- 原因：缺少 `/ai/extract-text` 路由

### 3. PDF 解析在 Jest 环境报错

- 现象：`pdf-parse` 在单测里触发 `dynamic import callback was invoked without --experimental-vm-modules`
- 处理：服务实现继续使用真实解析；单测中对 `pdf-parse` 做最小 mock，避免把 Jest 运行时问题误判成业务失败

## 实际改动

### `apps/server`

- 新增 `FileExtractionService`
- 新增 `AiFileController`
- 在 `AiModule` 中注册文件提取服务与控制器
- 支持按扩展名解析：
  - `txt`
  - `md`
  - `pdf`
  - `docx`
- 统一返回：
  - 文件名
  - 文件类型
  - MIME 类型
  - 提取文本
  - 字符数
- 对空结果与不支持的文件类型返回 `BadRequestException`

### 依赖补充

- 新增 `mammoth` 用于 `docx`
- 新增 `pdf-parse` 用于 `pdf`
- 新增 `multer` / `@types/multer` 用于上传处理
- 新增 `pdfkit`、`docx` 仅用于测试构造样本文件

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只完成了“文件提取入口”这一层：

- 有统一上传接口
- 有最小格式支持
- 有清晰错误反馈
- 有测试覆盖关键路径

没有提前进入：

- AI 分析编排
- 队列任务
- Redis 缓存
- `viewer` 只读能力限制

### 是否需要继续抽组件 / 抽函数

当前体量较小，暂不需要继续拆分：

- 文件解析规则集中在 `FileExtractionService`
- 路由层只做上传接收与参数转发
- 解析策略后续若继续增长，再考虑拆为独立 parser registry

### Review 结论

- 通过
- 保持当前最小实现，进入自测

## 自测结果

### 1. 服务层专项测试

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai/file-extraction.service.spec.ts`
- 结果：通过

### 2. 文件提取 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/ai-file-extraction.e2e-spec.ts`
- 结果：通过

### 3. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

## 遇到的问题

### 1. PDF 解析库在测试环境和运行环境行为不一致

- 风险：如果为了让单测通过而改坏真实实现，会影响后续真实上传链路
- 处理：保留运行时代码不变，只在单测里隔离掉 Jest 对 ESM worker 的限制

### 2. 容易过早引入复杂文件处理体系

- 风险：一上来就做 OCR、对象存储、任务队列，会让教程节奏失控
- 处理：这一轮只做最小文本提取，把入口和边界先站稳

## 可沉淀为教程 / 博客的点

- 为什么 AI 项目的前置能力是“统一文本提取入口”
- `pdf / docx / md / txt` 四类文件在 Node 服务端的最小处理方式
- 为什么 TDD 能帮助我们先锁定支持格式和错误边界
- 如何区分“当前该做的最小能力”和“后续再补的复杂能力”

## 后续待办

- 关闭 `issue-14`
- 继续 `M4 / issue-15`：缓存分析报告
- 再推进 `M4 / issue-16`：`admin` 触发实时 AI、`viewer` 只读缓存结果
