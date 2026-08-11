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

## [v2.3.1](https://github.com/Fridolph/my-resume/compare/v2.2.26...v2.3.1) - 2026-05-29

### 新功能

- **m21:** add user_docs search in local mode via SQLite embedding scan ([`136bb9d`](https://github.com/Fridolph/my-resume/commit/136bb9dfd310c8ebfd9e9d9d50c51f94aa553bb8))
- **m21:** add topic alignment and section boost attenuation to rerank ([`fc85064`](https://github.com/Fridolph/my-resume/commit/fc85064a25c9df60198d245d30a3248680e59b16))
- **m21:** import milvus chunks to SQLite, expand DB search to all source types ([`bb1abc2`](https://github.com/Fridolph/my-resume/commit/bb1abc2dd1c33cfdb551a13c267f4ea5615533e2))

### 问题修复

- **mock:** bump mock embedding dimension from 24 to 1536 for Milvus compatibility ([`1407867`](https://github.com/Fridolph/my-resume/commit/14078670ff365113625ce5cb8ad70475380aa316))
- **m21:** replace Node.js import script with Python for reliable SQLite writes ([`25f5464`](https://github.com/Fridolph/my-resume/commit/25f5464206a047d8ee16c037f63545395fb9ca11))
- **web:** guard localStorage access with typeof window check for SSR safety ([`81e2181`](https://github.com/Fridolph/my-resume/commit/81e21816e3d3ff2d95ffd501c73eaf06c8dd436c))

### 重构

- **m21:** deduplicate normalizeExtractedText and readFileExtension ([`9ea72b2`](https://github.com/Fridolph/my-resume/commit/9ea72b23a1138d80050a96a0922fd88bc6b8c2db))
- **m21:** rewrite import-resume-chunks as Node.js script ([`4e7edad`](https://github.com/Fridolph/my-resume/commit/4e7edadc8e746245d7b8c25e40262d75d95406aa))

### 文档

- **m22:** add resume-import 12-round source evolution doc, update nav ([`65c51e3`](https://github.com/Fridolph/my-resume/commit/65c51e325cbd27b1b6654139f6940af88cd16473))
- **changelog:** prepare v2.3.0 release notes ([`483d491`](https://github.com/Fridolph/my-resume/commit/483d49187cfd5730ede8363709a643dcaeb40f60))

### 工程与维护

- rename development→dev branch, clean stale tags, remove merged remote branch ([`2ca663a`](https://github.com/Fridolph/my-resume/commit/2ca663a33dff1474d3a75fc8b82830b6b987ebee))

### 合并记录

- **release:** M23 global AI chat + RAG optimization + admin RAG management ([`a2cec5a`](https://github.com/Fridolph/my-resume/commit/a2cec5a8756bebba792c447e5a62d6a4f764e9b9))

## [v2.7.0](https://github.com/Fridolph/my-resume/compare/v2.6.0...v2.7.0) - 2026-08-11

### 新功能

- **m33:** Rerank 模型接入 — Cross-Encoder 精排替代手写规则 (#244) ([`fb5ed62`](https://github.com/Fridolph/my-resume/commit/fb5ed62e5fa351b8c925700a2ccb285662b22769))
- **m34:** LLM 路由 fallback + Query Augment 骨架 + 边界守卫强化 (#245) ([`01d65b0`](https://github.com/Fridolph/my-resume/commit/01d65b0255fbaf97e9a322cf8e9bc9974b721829))
- **m37:** AI Chat 自动 smooth 滚动到底部 (#248) ([`edc6c22`](https://github.com/Fridolph/my-resume/commit/edc6c22b692acf31a1e37adeb5d9a1af3edf5b0d))
- **m36:** AI Chat 每20轮自动总结 (#247) ([`1c3c3b4`](https://github.com/Fridolph/my-resume/commit/1c3c3b4f11870ecce83221a3b344c71fd539b4f5))
- **m38:** AI Chat 桌面端 sticky 布局替代 fixed (#249) ([`58c58c4`](https://github.com/Fridolph/my-resume/commit/58c58c4b25b01c6f1b5c1c5171df4a03dacfc5d5))
- **m39:** AI Chat 每轮对话结构化日志 (#250) ([`efc9060`](https://github.com/Fridolph/my-resume/commit/efc90604fffe493937a656251b049a22f510ca91))
- **m38:** AI Chat 桌面端内容右padding挤压布局 (#249) ([`460721c`](https://github.com/Fridolph/my-resume/commit/460721c7f41b3eff7f4995a4c8b6eb6537270e89))
- **m38:** AI Chat 桌面端右侧全高侧边栏 + 移动端全屏 (#249) ([`443b883`](https://github.com/Fridolph/my-resume/commit/443b88386196e1f827317397eeb0e0f44a8f630d))
- **m41:** 新增 flattenForLocale + 公开 API 支持 locale 压平 (#254) ([`5edc041`](https://github.com/Fridolph/my-resume/commit/5edc041bfa56c424d4e9552a40b804f87791e68b))
- **m41:** Web 层适配 flat locale 响应 (#255) ([`f0e5d1d`](https://github.com/Fridolph/my-resume/commit/f0e5d1dfc29ef40b8cc0318880900a4419fb3d4f))
- **m41:** admin draft API 支持 ?locale= 压平 ([`6e4aa24`](https://github.com/Fridolph/my-resume/commit/6e4aa24def230b9372b56ef2ae1433e8268117b2))
- **m42:** Neo4j + graphology 双模 GraphStore (#257) ([`e633f59`](https://github.com/Fridolph/my-resume/commit/e633f59cc49355a85c1942ba85ca83002d7afb78))
- **m42:** GraphSyncService — 动态 Cypher 生成 + DI 注册 (#258) ([`7f3ac96`](https://github.com/Fridolph/my-resume/commit/7f3ac96d286e223f6590880f171544899b8b81c2))
- **m42:** GraphSearchService — LLM 转 Cypher 图查询 (#259) ([`24531be`](https://github.com/Fridolph/my-resume/commit/24531be0b96cee28334c180fbdef3b8d0476e5d2))
- **m42:** 新增 graph sourceType + 更新 types (#260) ([`99e2ebe`](https://github.com/Fridolph/my-resume/commit/99e2ebea026edb0d1f70130dcf178a6eb368e400))
- **m43:** Step 0-1 — sync 触发 + traverse 接口拆分 (#262) ([`176431e`](https://github.com/Fridolph/my-resume/commit/176431eb706bb6ea8757b3c626dfe56ecb35e98b))
- **m43:** Step 2 — route_intent 增加 retrieval_hint (#263) ([`8965ca0`](https://github.com/Fridolph/my-resume/commit/8965ca0abe7a7f55781d97406ffb2d4441c1e434))
- **m43:** retrieve 节点集成 GraphSearchService (#264) ([`33ff722`](https://github.com/Fridolph/my-resume/commit/33ff722e1ce4b895e1322b2242b736423019bbb9))
- **m43:** Neo4j 简历图谱练习骨架脚本 ([`78b00f5`](https://github.com/Fridolph/my-resume/commit/78b00f5695b2820f3cae0f7b6f86088291ab1603))
- **m43:** seed 脚本改为动态从 API 获取数据建图 ([`9022e3d`](https://github.com/Fridolph/my-resume/commit/9022e3d68899e8694bb740a7478e1c815588e36b))
- **web:** review-resume 页面 — HTML简历预览 + PDF下载 ([`f193e8f`](https://github.com/Fridolph/my-resume/commit/f193e8fb19255d75e913afe5aef0b86a928677f6))

### 问题修复

- **m33:** evaluate 不够时仍从 citation 生成回答 + knowledge 源参与卡片构建 ([`cad14b1`](https://github.com/Fridolph/my-resume/commit/cad14b1c6f7f2ccd5cd7b7164747eb23ce2c01cf))
- **m41:** Tailwind v4 兼容性 — 移除 :global() 和组合断点 ([`7fc0813`](https://github.com/Fridolph/my-resume/commit/7fc08133cdc19e7c89c17107f0c9440b6362fc3a))
- **m41:** 修复构建报错 — Tailwind v4 兼容 + use client 顺序 + 残留导入 ([`a812f3e`](https://github.com/Fridolph/my-resume/commit/a812f3e09dc398b1f06579e216c822c3e8498495))
- **m41:** login-shell.css 修复残留括号语法错误 ([`a304b9b`](https://github.com/Fridolph/my-resume/commit/a304b9b92eec5ca0ed3c78eca102a878cded1146))
- **m41:** 删除 login-shell.css, 全部转为 Tailwind 内联 + 修复 skills 平字符串兼容 ([`03edc81`](https://github.com/Fridolph/my-resume/commit/03edc8175daba0dd6de760108c9418d47d575d1a))
- **chat:** P0 prompt修复 + 对话压缩裁剪实现 ([`764aa40`](https://github.com/Fridolph/my-resume/commit/764aa4098da44dfc799d95bd42b5fc22c4c9d67a))
- **m43:** Interest 关系名 拥有→兴趣爱好 (#247 follow-up) ([`8c0210b`](https://github.com/Fridolph/my-resume/commit/8c0210b02b73e5eab61523ef3bc7db44bcab9986))
- 统一 Tailwind v4 语法 — @tailwind→@import (#header-regression) ([`8f5448a`](https://github.com/Fridolph/my-resume/commit/8f5448a09090c8db19c72875992607833183c005))
- **web:** review-resume 数据映射修复 + 组件拆分 + PDF 错误修复 ([`c3717b2`](https://github.com/Fridolph/my-resume/commit/c3717b29952dbf348330eb0212f176f2a073cb81))
- **web:** review-resume 字段对齐 API 实际响应 + 样式优化 ([`6bb6bd1`](https://github.com/Fridolph/my-resume/commit/6bb6bd1711fd637b49ccf0658610fca68783c70a))
- **m49:** 收束简历导出链路并统一发布稳定性 ([`fa1849d`](https://github.com/Fridolph/my-resume/commit/fa1849d99659f07356b2e28456bbcc41c8fcdbf0))
- **m50:** 修复 web 与 admin 暗色主题样式入口 ([`ec9c53f`](https://github.com/Fridolph/my-resume/commit/ec9c53f7039c37c42de7e948e83229afda129509))

### 重构

- **m40:** ai-talk entry 样式 Tailwind 化 + BEM @apply (#253) ([`a56c45e`](https://github.com/Fridolph/my-resume/commit/a56c45ed1dc975118249aa8a74536f23b63992df))
- **m40:** admin 登录页 + admin-shell 样式 Tailwind 化 (#251) ([`03bf1d8`](https://github.com/Fridolph/my-resume/commit/03bf1d89eb70af0f36cbebd1e0e732462f96e264))
- **m40:** web resume 样式 Tailwind 化 (hero+card+skills) (#252) ([`0bcf4ce`](https://github.com/Fridolph/my-resume/commit/0bcf4ce3e70977c0a5398908aed96799aae5bac6))
- **m40:** 修复 Tailwind v4 CSS 遗留问题 + Issue 草案 ([`0319a0b`](https://github.com/Fridolph/my-resume/commit/0319a0be21ab7c57bd2218efdd3e31741edbb31c))
- **chat:** ai-chat.service 重构 — QuotaService/Utils/TSDoc + Issue 草案 ([`73d5c32`](https://github.com/Fridolph/my-resume/commit/73d5c323168179d2a0067d543d36856d867384a2))
- **admin:** admin-shell.css 冗余样式合并为 Tailwind @apply ([`060f5de`](https://github.com/Fridolph/my-resume/commit/060f5deb5c217feeb2004f73e52555455520ec4d))

### 文档

- **m33:** README + 部署教程 增加本地构建→推送→部署完整流程 ([`8bb2885`](https://github.com/Fridolph/my-resume/commit/8bb2885490641c9055f44d24afa7dadf657c0896))
- **m35:** M33 升级学习博客 — 手写 Rerank → Cross-Encoder 精排实录 ([`329578f`](https://github.com/Fridolph/my-resume/commit/329578f6c62598c9b3da2a81d38e82085927356c))
- **m33-m34:** 为核心流程添加 TSDoc 注释 ([`95c4758`](https://github.com/Fridolph/my-resume/commit/95c4758f9a7fd80e7f1deb473a183b787641026b))
- **m42:** GraphRAG 学习博客 + 关闭 M42 (#261) ([`6a5c733`](https://github.com/Fridolph/my-resume/commit/6a5c733af5d7a9a64d2745cfde090dae4c60d67a))
- **m43:** GraphRAG 复盘博客 + 关闭 M43 (#265) ([`932d1f2`](https://github.com/Fridolph/my-resume/commit/932d1f273354c44f6f6d1020641b9f16e2c678ce))
- **chat:** 对话压缩与展示优化 Issue 草案 — 20轮压缩 + 最近2轮展示 ([`f9b70a6`](https://github.com/Fridolph/my-resume/commit/f9b70a6b628422c14df8770d627e7472b3bef98e))
- **m30:** ai-chat-graph.service.ts 补全 TSDoc 注释 ([`bd1a10f`](https://github.com/Fridolph/my-resume/commit/bd1a10f19675d11e4e3e78f66556a8150adafed6))
- **m43:** Neo4j 知识图谱学习笔记 — 从表格思维到图思维 ([`f89b133`](https://github.com/Fridolph/my-resume/commit/f89b13370ebe913606a6426ae429e37e0b86f262))
- M43-fix ~ M48 后续里程碑 Issue 草案 ([`3d3c4f7`](https://github.com/Fridolph/my-resume/commit/3d3c4f737f89621e54755a5cbcd96d74d9babfcb))

### 样式

- **m38:** AI Chat 宽度 640px + 圆角改小 + CSS 文件检查 ([`cb141e9`](https://github.com/Fridolph/my-resume/commit/cb141e970e3ed450375c39e85d1239658e4141d2))

### 其他变更

- Revert "feat(m38): AI Chat 桌面端内容右padding挤压布局 (#249)" ([`806dd28`](https://github.com/Fridolph/my-resume/commit/806dd283ace4513af6606e9078acf2c60ff9848b))
- Revert "feat(m38): AI Chat 桌面端 sticky 布局替代 fixed (#249)" ([`e0eb763`](https://github.com/Fridolph/my-resume/commit/e0eb763ff89b64726d7479332feb9b7442223900))
- Revert "feat(m41): admin draft API 支持 ?locale= 压平" ([`ba5eb8e`](https://github.com/Fridolph/my-resume/commit/ba5eb8ef74dc52cb9e483e481a3cf87156ac0cb7))
