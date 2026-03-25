# M5 / issue-17 Markdown 导出

- Issue：`#22`
- 里程碑：`M5 导出与下载：Markdown / PDF`
- 分支：`feat/m5-issue-17-markdown-export`
- 日期：`2026-03-25`

## 背景

在已发布简历内容已经跑通之后，最适合作为导出起点的能力就是 Markdown。  
它比 PDF 更容易解释、调试和测试，也能先把“导出内容必须与已发布版本一致”这条主线固定下来。

因此 M5 的第一步不碰复杂样式布局，先让 `apps/server` 对外输出标准 Markdown 简历。

## 本次目标

- 由 `apps/server` 生成标准 Markdown 简历
- 导出内容与已发布版本保持一致
- 支持 `zh / en` 导出
- 提供公开下载响应
- 补齐服务层与 E2E 测试

## 非目标

- 不做 PDF 布局
- 不做多模板切换
- 不接 `web / admin` 下载按钮
- 不做文件持久化存储

## TDD / 测试设计

### 服务层单测

新增 `apps/server/src/modules/resume/resume-markdown-export.service.spec.ts`，先锁定：

- 默认可输出中文 Markdown
- 可按 `locale=en` 输出英文 Markdown
- 内容包含个人信息、摘要、经历与技术栈等核心模块

### E2E

在 `apps/server/test/resume-publication.e2e-spec.ts` 中补充：

- 未发布时导出接口返回 `404`
- 发布后可访问 `GET /resume/published/export/markdown`
- 返回 `text/markdown`
- 返回附件文件名
- 不支持的 `locale` 返回 `400`

## 首次失败记录

### 1. Markdown 导出服务不存在

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/resume/resume-markdown-export.service.spec.ts`
- 结果：失败
- 原因：缺少 `ResumeMarkdownExportService`

### 2. 导出接口不存在

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/resume-publication.e2e-spec.ts`
- 结果：失败
- 原因：缺少 `GET /resume/published/export/markdown`

## 实际改动

### `apps/server`

- 新增 `ResumeMarkdownExportService`
- 在 `ResumeController` 中新增：
  - `GET /resume/published/export/markdown`
- 导出逻辑直接读取“已发布快照”
- 支持 `locale=zh | en`
- 默认使用简历的 `defaultLocale`
- 设置响应头：
  - `Content-Type: text/markdown; charset=utf-8`
  - `Content-Disposition: attachment; filename="standard-resume-{locale}.md"`

### 导出内容范围

当前 Markdown 包含：

- 个人简介
- 相关链接
- 兴趣方向
- 亮点
- 工作经历
- 项目经历
- 教育经历
- 技能清单

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只完成了 Markdown 导出这一个子能力：

- 只导出已发布简历
- 只做 Markdown
- 没有提前进入 PDF 或前端下载入口

### 是否存在可继续抽离的点

当前拆分已经比较清晰：

- `ResumePublicationService` 负责已发布数据来源
- `ResumeMarkdownExportService` 负责纯导出格式化
- `ResumeController` 只负责公开响应输出

后续做 PDF 时可以平行新增 `ResumePdfExportService`，不需要把 Markdown 逻辑塞回控制器。

### Review 结论

- 通过
- 可以进入自测与提交阶段

## 自测结果

### 1. Resume 模块单测

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/resume/resume-publication.service.spec.ts src/modules/resume/resume-markdown-export.service.spec.ts`
- 结果：通过

### 2. 发布流 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/resume-publication.e2e-spec.ts`
- 结果：通过

### 3. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

## 遇到的问题

### 1. 导出应该基于 draft 还是 published 很容易摇摆

- 风险：如果导出读取 draft，会让公开站和导出结果不一致
- 处理：当前统一只导出 published，先保证行为稳定

### 2. Markdown 很容易在第一轮写成“临时拼字符串”

- 风险：后续做 PDF 或多模板时无法复用结构
- 处理：单独抽 `ResumeMarkdownExportService`，让格式化职责集中

## 可沉淀为教程 / 博客的点

- 为什么 M5 第一轮先做 Markdown，而不是直接做 PDF
- 为什么导出必须绑定已发布快照，而不是草稿
- 如何把“导出格式化”从控制器里独立出来
- 如何用测试锁定内容一致性与响应头契约

## 后续待办

- 关闭 `issue-17`
- 继续 `issue-18`：PDF 导出
- 然后再推进 `issue-19`：`web/admin` 下载入口
