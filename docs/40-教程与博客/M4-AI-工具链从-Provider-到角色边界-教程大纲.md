# M4 AI 工具链从 Provider 到角色边界：教程大纲

- 里程碑：`M4 AI 工具链：Mock 到真实 Provider`
- 日期：`2026-03-25`
- 目标读者：想做“可学习、可演进”的 AI 能力后端初学者 / 进阶开发者

## 一、为什么 M4 不直接“接大模型然后开干”

- 教程型项目为什么要先拆 Provider、再做文件提取、缓存、角色边界
- 为什么这比“一步到位接 SDK”更适合读者学习
- 当前 M4 的边界：只做最小闭环，不做复杂编排

## 二、先把 Provider 抽象立住

- `mock provider` 的作用是什么
- 为什么七牛云 / DeepSeek 可以统一走 OpenAI-compatible 适配层
- `AiService` 为什么要作为唯一 AI 调用入口

## 三、文件提取是 AI 能力的前置基础设施

- 为什么要先做 `txt / md / pdf / docx` 最小解析
- 为什么上传解析应该放在 `NestJS`，而不是前端或双后端里分裂实现
- 服务端统一文本提取接口的价值

## 四、缓存分析报告为什么要单独做一轮

- 什么是“稳定的 mock 报告结构”
- 为什么同一输入复用同一份结果很重要
- 如何把缓存结构先固定下来，后面再替换真实 AI 输出

## 五、admin 触发与 viewer 只读为什么必须分开

- 如果 `viewer` 也能触发，会带来什么问题
- 如何让 `viewer` 只读缓存 / mock 结果
- 如何让 `admin` 保留触发入口，为后续真实 AI 接入预留边界

## 六、这一轮我们具体落了哪些接口

- `POST /ai/extract-text`
- `GET /ai/reports/cache`
- `GET /ai/reports/cache/:reportId`
- `POST /ai/reports/cache`
- `POST /ai/reports/analyze`

## 七、测试怎么设计更符合教程节奏

- 为什么这轮仍然坚持 TDD
- 单测如何锁定 Provider、缓存、解析、角色边界
- E2E 如何覆盖 viewer/admin 两类体验差异

## 八、当前 M4 的遗留与下一步

- 为什么还没有上 Redis / BullMQ
- 为什么还没有接数据库持久化
- 为什么真实成本控制、队列任务、Prompt 工作流要放到后续阶段
- 下一步如何进入导出、部署和完整上线链路

## 九、可扩展成正式教程的章节草案

- 《教程型 AI 项目，第一步不是接 SDK，而是先抽 Provider》
- 《NestJS 如何做统一文件提取入口》
- 《缓存报告结构先行：让 AI 功能先可演示，再可增强》
- 《admin 触发、viewer 只读：AI 权限边界的最小闭环》
