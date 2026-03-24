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

### issue-05 角色模型定义

- `admin` / `viewer`

### issue-06 登录流程设计

- 先做最小闭环

### issue-07 viewer 只读体验

- 明确哪些能力允许看，哪些不允许触发

## M3 简历内容与发布流

### issue-08 双语内容模型

### issue-09 草稿与发布态

### issue-10 web 公开读取已发布版本

## M4 AI 工具链

### issue-11 provider 适配器接口

### issue-12 文件提取入口

### issue-13 缓存分析报告

### issue-14 admin 触发 / viewer 只读

## M5 导出与下载

### issue-15 markdown 导出

### issue-16 pdf 导出

### issue-17 web/admin 下载入口

## M6 测试、CI/CD、部署

### issue-18 单元测试基建

### issue-19 GitHub Actions

### issue-20 Vercel + 云服务器部署文档
