# M4 / issue-13 provider 适配器接口

- Issue：`#18`
- 里程碑：`M4 AI 工具链：Mock 到真实 Provider`
- 分支：`feat/m4-issue-13-ai-provider-adapter`
- 日期：`2026-03-25`

## 背景

在真正进入文件提取、缓存报告和 AI 工具链前，必须先把 Provider 抽象固定下来。  
否则后续一旦直接把七牛云、DeepSeek 或其他兼容接口写进业务代码，后面切换模型、切换厂商、补 mock provider 都会越来越痛苦。

这一轮用户已经补了 `.env.development.local`，并明确当前优先使用七牛云兼容接口，因此本轮除了抽适配器，还要把本地环境加载一起接通。

## 本次目标

- 定义统一 AI Provider 接口
- 支持 `mock` provider
- 支持 `qiniu / deepseek / openai-compatible` 三类配置解析
- 提供统一的 `AiService` 入口
- 让 `apps/server` 可自动读取根目录 `.env.development.local`

## 非目标

- 不实现真实业务 Prompt 编排
- 不实现文件上传与文本提取
- 不实现缓存报告
- 不开放完整 AI API 路由

## TDD / 测试设计

### 配置解析

- 新增 `apps/server/src/modules/ai/config/ai-config.spec.ts`
- 先锁定：
  - 未配置时回落到 `mock`
  - `qiniu` 解析为 OpenAI-compatible profile
  - `deepseek` 解析为 OpenAI-compatible profile
  - 缺少必要凭证时报错

### Provider 行为

- 新增 `mock-ai.provider.spec.ts`
  - `mock` 返回稳定假数据
- 新增 `openai-compatible-ai.provider.spec.ts`
  - 统一调用 `/chat/completions`
  - 正确带上 `Bearer Token`

### 统一服务入口

- 新增 `ai.service.spec.ts`
  - 暴露当前 provider summary
  - 通过统一入口调用 provider

### 环境文件顺序

- 新增 `env-paths.spec.ts`
  - 锁定 `.env.development.local -> .env.local -> .env.development -> .env`

## 首次失败记录

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai/config/ai-config.spec.ts`
- 结果：失败
- 原因：缺少 `ai-config`

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai/providers/mock-ai.provider.spec.ts`
- 结果：失败
- 原因：缺少 `MockAiProvider`

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai/providers/openai-compatible-ai.provider.spec.ts`
- 结果：失败
- 原因：缺少 `OpenAiCompatibleAiProvider`

## 实际改动

### `apps/server`

- 新增 `AiModule`
- 新增 `AiService`
- 新增统一接口定义：
  - `AiProvider`
  - `GenerateTextInput`
  - `GenerateTextResult`
- 新增运行时配置解析：
  - `resolveAiRuntimeConfig`
- 新增 provider 实现：
  - `MockAiProvider`
  - `OpenAiCompatibleAiProvider`
- 新增 `createAiProvider` factory
- 新增环境文件路径解析：
  - `buildServerEnvFilePaths`
- 在 `AppModule` 中接入 `ConfigModule`
- 让 `AuthModule` 同时兼容 `JWT_SECRET` 与旧的 `AUTH_JWT_SECRET`

### 文档与环境示例

- 新增根目录 `.env.example`
- 补充七牛云、DeepSeek、其他 OpenAI-compatible provider 的示例配置

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做了：

- provider 抽象
- mock / real-compatible provider 适配层
- 统一服务入口
- 本地 env 自动加载

没有提前进入：

- AI 业务接口
- 文件提取
- 缓存层
- prompt 模板体系

### 是否存在可继续抽离的点

- 当前 `AiService` 已经是后续 AI 业务模块的统一入口
- `OpenAiCompatibleAiProvider` 可继续承接七牛云、DeepSeek、其他兼容厂商
- 后续若增加 Anthropic / Gemini 等非 OpenAI-compatible 协议，再新增 provider 类即可

### Review 结论

- 通过
- 可进入自测

## 自测结果

### 1. AI 模块专项测试

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai src/config/env-paths.spec.ts`
- 结果：通过

### 2. `apps/server` 全量单测

- `pnpm --filter @my-resume/server exec jest --runInBand`
- 结果：通过

### 3. `apps/server` 全量 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand`
- 结果：通过

### 4. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

### 5. 根级验证

- `pnpm run typecheck`
- 结果：通过
- `pnpm run build`
- 结果：通过
- 备注：根项目仍存在 `tailwind.config.cjs` 的 ESM warning，但不影响本轮结果

## 遇到的问题

### 1. 只写适配器还不够，本地 env 不会自动读取

- 风险：用户已经写了 `.env.development.local`，但若服务端不主动加载，适配器根本拿不到配置
- 处理：在 `AppModule` 中接入 `ConfigModule.forRoot()`，并显式指定根目录 env 搜索顺序

### 2. 当前项目里 JWT 变量名与用户实际配置不一致

- 现象：原实现读取 `AUTH_JWT_SECRET`，但用户本地配置写的是 `JWT_SECRET`
- 处理：兼容两个变量名，优先使用 `JWT_SECRET`

### 3. Provider 抽象很容易一开始就写太重

- 风险：如果过早引入复杂 prompt SDK、工作流层、任务编排，会打乱教程节奏
- 处理：当前只保留统一 `generateText` 能力，先把抽象和兼容接口站稳

## 可沉淀为教程 / 博客的点

- 为什么 AI 项目第一步不是“接 SDK”，而是先做 provider 适配器
- 如何用一个 OpenAI-compatible provider 兼容多个厂商
- 为什么 `.env.development.local` 接好了不代表应用能自动读取
- mock provider 在教程型项目里有什么价值

## 后续待办

- 继续 `issue-14`：文件提取入口
- 或按主线回到 `M3 / issue-10`：双语内容模型
