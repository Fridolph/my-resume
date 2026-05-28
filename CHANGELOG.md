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

## [v2.3.0](https://github.com/Fridolph/my-resume/compare/v2.2.26...v2.3.0) - 2026-05-28

### 新功能

- **m21:** add user_docs search in local mode via SQLite embedding scan ([`136bb9d`](https://github.com/Fridolph/my-resume/commit/136bb9dfd310c8ebfd9e9d9d50c51f94aa553bb8))
- **m21:** add topic alignment and section boost attenuation to rerank ([`fc85064`](https://github.com/Fridolph/my-resume/commit/fc85064a25c9df60198d245d30a3248680e59b16))
- **m21:** import milvus chunks to SQLite, expand DB search to all source types ([`bb1abc2`](https://github.com/Fridolph/my-resume/commit/bb1abc2dd1c33cfdb551a13c267f4ea5615533e2))

### 问题修复

- **mock:** bump mock embedding dimension from 24 to 1536 for Milvus compatibility ([`1407867`](https://github.com/Fridolph/my-resume/commit/14078670ff365113625ce5cb8ad70475380aa316))
- **m21:** replace Node.js import script with Python for reliable SQLite writes ([`25f5464`](https://github.com/Fridolph/my-resume/commit/25f5464206a047d8ee16c037f63545395fb9ca11))

### 重构

- **m21:** deduplicate normalizeExtractedText and readFileExtension ([`9ea72b2`](https://github.com/Fridolph/my-resume/commit/9ea72b23a1138d80050a96a0922fd88bc6b8c2db))
- **m21:** rewrite import-resume-chunks as Node.js script ([`4e7edad`](https://github.com/Fridolph/my-resume/commit/4e7edadc8e746245d7b8c25e40262d75d95406aa))

### 文档

- **m22:** add resume-import 12-round source evolution doc, update nav ([`65c51e3`](https://github.com/Fridolph/my-resume/commit/65c51e325cbd27b1b6654139f6940af88cd16473))

### 合并记录

- **release:** M23 global AI chat + RAG optimization + admin RAG management ([`a2cec5a`](https://github.com/Fridolph/my-resume/commit/a2cec5a8756bebba792c447e5a62d6a4f764e9b9))
