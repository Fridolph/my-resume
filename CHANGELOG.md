# Changelog

本文件记录正式进入 `main` 并打上 `v*` tag 的版本发布说明。

- 版本来源以 Git tag 为准，而不是根 `package.json` 的 `version` 字段
- 当前先从本次接入之后开始维护，历史版本按需再补录
- 默认发布节奏：`issue -> development -> main -> tag -> release`

## [v2.2.23](https://github.com/Fridolph/my-resume/compare/v2.2.22...v2.2.23) - 2026-04-29

### 新增

- **AI 简历导入识别**：上传 md/txt 简历文件，经 AI 识别生成候选草稿，支持模块级 diff 对照与选择性回填
- **SSE 任务事件推送**：简历导入识别任务支持 Server-Sent Events 实时推送阶段状态与进度提示
- **AI 结构化输出**：服务端接入 LangChain tool-call structured stream，提升 AI 输出稳定性
- **历史识别记录**：Admin 简历导入页新增分页历史表格，支持查看详情与删除记录
- **CHANGELOG 与发布脚本**：建立 CHANGELOG.md 与 tag diff 驱动的 release notes 生成工具

### 变更

- Admin AI 工作台拆分为独立模块卡片入口（简历导入、针对性分析、RAG 入库、文件提取、诊断工具）
- API Client 新增 SSE 流式、历史删除、resume-import 类型支持
- `packages/utils` 新增 `formatFileSize` 共享函数

### 移除

- 删除 Admin AI 区域 12 个纯 UI 渲染测试文件，保留 API 契约测试

## [v2.2.24](https://github.com/Fridolph/my-resume/compare/v2.2.23...v2.2.24) - 2026-04-29

### 新功能

- **release:** add one-click full-release.sh and npm release script ([`191519c`](https://github.com/Fridolph/my-resume/commit/191519c190396af46d2acb0189d854f0f388fc01))

### 文档

- update CHANGELOG v2.2.23 release notes ([`cd5470e`](https://github.com/Fridolph/my-resume/commit/cd5470e82627ed9ad18e00b450167248e6e33ab0))

### 工程与维护

- auto-create .env from .env.stack.local before dev/docker:up ([`f71d35c`](https://github.com/Fridolph/my-resume/commit/f71d35cd81d09ddad2ec4be12d60ac1f5cc07224))

## [v2.2.25](https://github.com/Fridolph/my-resume/compare/v2.2.24...v2.2.25) - 2026-04-29

### 问题修复

- **release:** use raw git commands for tag check in full-release.sh ([`5186d33`](https://github.com/Fridolph/my-resume/commit/5186d33cbb07215244fe53a21b1eeb31c574e07b))
- **release:** make certbot renewal non-fatal in release.sh ([`8441ffd`](https://github.com/Fridolph/my-resume/commit/8441ffd355b5cc542901f1415f9d6d465d990ea8))

## [v2.2.26](https://github.com/Fridolph/my-resume/compare/v2.2.25...v2.2.26) - 2026-04-29

### 问题修复

- **release:** use REPO_ROOT/deploy/ecs for release-from-local.sh path ([`1a353e1`](https://github.com/Fridolph/my-resume/commit/1a353e12b9abff09ba95a5f720a3819255d11c17))
- **deploy:** remove unconditional return 0 from sudo_cmd root branch ([`23191a5`](https://github.com/Fridolph/my-resume/commit/23191a567c9cd4a75351ba8aa49942c700247dc6))
