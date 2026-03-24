# 里程碑与 Issue 拆解建议

本文件不是实际 Issue 的替代品，而是**Issue 规划草稿池**。

## M1 基础工程

### issue-01 workspace 初始化

- 背景：当前仓库仍是单体 Vue 项目
- 目标：只引入 workspace 基础结构，不迁移业务
- 验收：能解释为什么这么拆，不要求功能迁移完成

### issue-02 apps 与 packages 占位骨架

- 目标：建立 `apps/web`、`apps/admin`、`apps/server` 与 `packages/*` 的最小占位结构

### issue-03 共享配置占位

- 目标：逐步引入共享 `tsconfig`、`eslint`、环境变量约束骨架

### issue-04 空应用脚手架策略说明

- 目标：写清何时创建真实 `Next.js` / `NestJS` 应用，而不是在 M1 一次性生成

## M2 鉴权与角色

### issue-05 apps/server 最小 NestJS 脚手架

- 目标：为后续鉴权与角色能力提供唯一业务后端入口

### issue-06 鉴权领域与角色模型

- 目标：定义 `admin` / `viewer`、用户实体与权限边界

### issue-07 JWT 登录最小闭环

- 目标：完成登录、令牌签发、最小鉴权闭环

### issue-08 apps/admin 最小登录壳

- 目标：创建后台登录壳，只承接最小登录与鉴权状态

### issue-09 viewer 只读守卫与体验

- 目标：明确哪些能力只读、哪些能力禁止触发真实操作

## M3 简历内容与发布流

### issue-10 双语内容模型

- 目标：建立标准简历的双语数据结构与模块边界（`zh/en`）

### issue-11 草稿与发布态

- 目标：建立草稿 / 已发布状态与最小发布流

### issue-12 web 公开读取已发布版本

- 目标：创建 `apps/web` 最小展示壳，并只读取已发布内容

## M4 AI 工具链

### issue-13 provider 适配器接口

- 目标：建立 AI Provider 抽象与 OpenAI-compatible 适配器入口
- 说明：当前无正式 API Key，可先落地本地 mock / fake provider

### issue-14 文件提取入口

- 目标：支持 `pdf/md/txt/docx` 的最小文本提取入口

### issue-15 缓存分析报告

- 目标：建立 mock 结果缓存与任务结果读取链路

### issue-16 admin 触发 / viewer 只读

- 目标：在后台中区分 `admin` 真实触发、`viewer` 只读 mock 体验

## M5 导出与下载

### issue-17 markdown 导出

- 目标：由 `apps/server` 输出标准 Markdown 简历导出

### issue-18 pdf 导出

- 目标：由 `apps/server` 输出标准 PDF 简历导出

### issue-19 web/admin 下载入口

- 目标：在 `apps/web` 与 `apps/admin` 中接入导出下载入口

## M6 测试、CI/CD、部署

### issue-20 单元测试基建

- 目标：补齐 `apps/server`、`apps/admin`、`apps/web` 的基础测试策略与关键测试

### issue-21 GitHub Actions

- 目标：建立类型检查、测试、构建的 CI 流程

### issue-22 Vercel + 云服务器部署文档

- 目标：打通 `web/admin` 前端部署与 `server` 云主机部署文档
