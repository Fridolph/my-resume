# 个人简历 Monorepo 重构总方案（v1 学习版）

## Summary

- **目标**：把现有静态 Vue 简历站，重构为一个**可学习、可开源、可部署、可写教程系列**的全栈 monorepo。
- **v1 产品边界**：只做 **1 份标准通用版双语简历（`zh/en`）**，不做按 JD 派生的多版本简历；JD 定制版、商业版能力全部后置。
- **推荐技术栈**：`pnpm workspace` + `Turborepo` + `Next.js(App Router)`（`web/admin`）+ `NestJS` + `Drizzle ORM` + `SQLite/libsql`。
- **角色模型**：`admin` 可编辑/发布/触发 AI；`viewer` 只读，只能体验**缓存好的预设分析结果**，不能发起真实 AI 调用。
- **导出策略**：`pdf/md` 统一由 `NestJS` 生成与下载。
- **部署主线**：`web/admin` 部署到 `Vercel`，`NestJS/Redis/SQLite(libsql)` 部署到云服务器；CI/CD 作为正式里程碑纳入教程。

## Key Changes

### Monorepo 结构

- `apps/web`：公开简历展示，SSR/SEO 优先，提供在线浏览与导出下载入口。
- `apps/admin`：后台管理，登录后可编辑简历、发布、查看 AI 结果、体验缓存报告。
- `apps/server`：唯一业务后端，承载鉴权、简历 CRUD、AI、文件、导出、队列、权限。
- `packages/ui`：共享 React UI 组件与主题。
- `packages/api-client`：共享 API 请求层、DTO 类型、错误码。
- `packages/config`：共享 `tsconfig`、`eslint`、环境变量约束。

### 前端选型

- `web` 与 `admin` 都使用 `Next.js App Router + TypeScript + Tailwind`。
- 后台数据请求统一使用 `TanStack Query`；表单统一使用 `React Hook Form + Zod`。
- 不引入 Redux；局部状态保持简单。

### 后端选型

- `NestJS` 继续作为唯一业务后端。
- `Redis/BullMQ` 用于 AI 任务、文件解析、重试和状态流转。
- AI Provider 使用**适配器模式**，允许用户通过 `.env.local` 配置自己的模型、协议和 base URL。

### 数据库与内容模型

- 只维护**一份标准简历**，同一条记录直接包含 `zh/en` 多语言内容。
- 数据按模块拆分：`profile`、`education`、`experiences`、`projects`、`skills`、`highlights`、`attachments`。
- 增加“**草稿 / 已发布**”状态，后台编辑草稿，公开站只读取已发布内容。
- 不设计 `resume_variant`、`jd_specific_resume` 等高级表；相关能力留给商业版。

### 导出与模板

- `NestJS` 提供统一导出接口：`MD` 基于模板生成，`PDF` 基于服务端模板/渲染生成。
- v1 只支持标准模板导出；“切换简历模板”只保留为后续规划，不纳入本期。

### i18n 设计

- UI 文案 i18n 与简历内容 i18n 分离。
- UI 文案仍按前端国际化方案处理。
- 简历内容采用“**字段级双语存储**”：稳定字段和内容字段都直接带 `zh/en`，避免后续结构漂移。
- 由于 v1 不做 JD 变体，所以“固定字段”和“可变字段”只体现在编辑模块职责上，不拆出额外内容模型。

## Why Not Dual Backend

### 原则

- `Next.js` 负责页面、路由、SSR、前端会话壳。
- `NestJS` 负责所有业务 API、权限、文件、AI、导出、任务队列。

### 为什么避免

- 避免同时维护两套 API、DTO、校验、错误码和日志链路。
- 避免鉴权、上传、AI 任务状态、导出接口分裂，教程会更难讲清楚。
- 避免后续接移动端、CLI、其他前端时无法直接复用业务层。

### 怎么落地避免

- 约束：`apps/web` 与 `apps/admin` 只调用 `apps/server`。
- `Next Route Handlers` 默认不承载业务逻辑；如必须存在，也只能做极薄的前端相关桥接，不写业务规则。
- DTO、OpenAPI、守卫、权限、任务状态、导出能力全部由 `NestJS` 统一对外。

## Public APIs / Interfaces

### 公开接口

- 获取已发布双语简历内容。
- 获取附件与导出下载信息。

### 后台接口

- 登录、刷新令牌、退出登录。
- 简历模块 CRUD、发布、回滚。
- 文件上传与文本提取。
- 创建 AI 分析任务、查询任务状态、读取缓存结果。
- 生成并下载 `pdf/md`。

### 权限接口语义

- `admin`：可写、可发布、可触发实时 AI。
- `viewer`：只读、只能访问缓存报告与预设体验，不可修改、不可信触发真实 AI。

### AI 适配器接口

- 统一抽象 `model`、`provider`、`baseURL`、`apiKey`、`protocol/options`。
- 首版只要求适配常见 OpenAI-compatible 协议；其他 provider 后续增量扩展。

## Milestones

### M1 基础工程

- 初始化 `pnpm workspace + turbo`
- 建立 `web/admin/server/packages` 结构
- 配置共享 `tsconfig/eslint/env`
- 输出仓库规范文档与开发约定
- 同步一篇“为什么这样做 monorepo”文章

### M2 鉴权与角色

- `NestJS` 完成 `admin/viewer` 鉴权与授权
- `admin` 后台接通登录流程
- `viewer` 只读能力落地
- 同步一篇“单管理员 + viewer 教程型权限设计”文章

### M3 简历内容与发布流

- 完成双语简历数据表与 CRUD
- 后台支持编辑、预览、发布
- `web` 站只读取已发布版本
- 同步一篇“内容模型 + i18n + 发布态”文章

### M4 AI 工具链

- 接入上传、文本提取、队列任务、结果缓存
- 完成 JD 匹配分析、简历建议、offer 对比的基础流程
- `viewer` 只体验缓存结果，`admin` 才能触发实时任务
- 同步一篇“AI Provider 适配器 + 队列 + 缓存”文章

### M5 导出与下载

- `NestJS` 实现 `md/pdf` 导出
- `web` 与 `admin` 都接入下载入口
- 同步一篇“服务端导出设计”文章

### M6 测试、CI/CD、部署

- 补齐单元测试、集成测试、关键 E2E
- 建立 GitHub Actions 流程
- 完成 `Vercel + 云服务器` 部署文档
- 输出“从 0 到上线”的系列收官文章

## Test Plan

### 测试策略

- 采用 **TDD**：先定义模块行为，再写实现。
- 单测优先覆盖 `NestJS` 服务层、权限、AI 适配器、导出、队列状态流转。
- 集成测试覆盖 API 合约、数据库读写、鉴权与角色限制。
- E2E 覆盖登录、编辑、发布、公开浏览、缓存报告体验、导出下载。

### 关键场景

- `admin` 登录/刷新/退出正常。
- `viewer` 无法编辑、发布、触发实时 AI。
- 双语内容保存与读取正常，公开站语言切换正确。
- 发布后 `web` 读取的是已发布版本，不受草稿影响。
- 上传 `pdf/docx/md/txt` 可解析；异常文件会被拒绝。
- AI 任务具备排队、处理中、完成、失败四种状态。
- `pdf/md` 导出可下载，权限受控。

### 质量门禁

- PR 必须通过类型检查、单元测试、核心集成测试。
- 主分支部署前必须通过构建和关键 E2E。

## Assumptions

- v1 是**教程型开源作品**，不是多租户 SaaS。
- v1 只维护一份标准通用版双语简历。
- `viewer` 角色用于体验和演示，不承担真实生产用户语义。
- AI 成本控制通过“仅管理员真实调用 + viewer 只读缓存”来解决。
- 多模板简历、JD 定制版本、商业版功能全部显式后置，不进入当前里程碑。
