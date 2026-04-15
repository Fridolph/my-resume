# M5 / issue-18 PDF 导出

- Issue：`#25`
- 里程碑：`M5 导出与下载：Markdown / PDF`
- 分支：`feat/m5-issue-18-pdf-export`
- 日期：`2026-03-25`

## 背景

在 Markdown 导出已经固定住内容结构后，M5 的第二步就是 PDF。  
这一轮的目标不是把 PDF 做成复杂排版模板，而是先打通“已发布内容 -> 服务端 PDF 下载”这条主链路。

这样后续无论是做精细样式、打印优化，还是多模板扩展，都有了稳定的服务端出口。

## 本次目标

- 由 `apps/server` 输出标准 PDF 简历
- 导出内容与已发布版本保持一致
- 支持 `zh / en` 导出
- 提供公开下载响应
- 补齐服务层与 E2E 测试

## 非目标

- 不做复杂排版模板
- 不做多页精细设计
- 不接 `web / admin` 下载按钮
- 不引入浏览器端 PDF 渲染

## TDD / 测试设计

### 服务层单测

新增 `apps/server/src/modules/resume/resume-pdf-export.service.spec.ts`，先锁定：

- 可输出 PDF 二进制内容
- 结果 buffer 具有 `%PDF` 头部

### E2E

在 `apps/server/test/resume-publication.e2e-spec.ts` 中补充：

- 发布后可访问 `GET /resume/published/export/pdf`
- 返回 `application/pdf`
- 返回附件文件名
- 不支持的 `locale` 返回 `400`

## 首次失败记录

### 1. PDF 导出服务不存在

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/resume/resume-pdf-export.service.spec.ts`
- 结果：失败
- 原因：缺少 `ResumePdfExportService`

### 2. PDF 导出接口不存在

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/resume-publication.e2e-spec.ts`
- 结果：失败
- 原因：缺少 `GET /resume/published/export/pdf`

## 实际改动

### `apps/server`

- 新增 `ResumePdfExportService`
- 在 `ResumeController` 中新增：
  - `GET /resume/published/export/pdf`
- PDF 渲染基于 `pdfkit`
- PDF 内容基于现有 Markdown 导出结果进一步渲染，保证内容来源统一
- 支持 `locale=zh | en`
- 设置响应头：
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="standard-resume-{locale}.pdf"`

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只完成了 PDF 导出主链路：

- 只导出已发布内容
- 只做最小可用 PDF
- 没有提前进入 web/admin 下载入口
- 没有提前做复杂样式布局

### 是否存在可继续抽离的点

当前拆分依旧清晰：

- `ResumeMarkdownExportService` 负责内容文本结构
- `ResumePdfExportService` 负责 PDF 渲染
- `ResumeController` 只做公开响应输出

后续如果要做更精细的 PDF 模板，可以继续保留同样的职责边界。

### Review 结论

- 通过
- 可以进入自测与提交阶段

## 自测结果

### 1. Resume 导出单测

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/resume/resume-pdf-export.service.spec.ts`
- 结果：通过

### 2. 发布流 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/resume-publication.e2e-spec.ts`
- 结果：通过

### 3. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

## 遇到的问题

### 1. PDF 内容如果重新单独拼装，容易和 Markdown / 已发布内容漂移

- 风险：两套导出逻辑越走越远，后续很难保证一致性
- 处理：当前让 PDF 复用 Markdown 导出内容作为文本来源，再进行 PDF 渲染

### 2. 过早追求 PDF 精美样式会打乱教程节奏

- 风险：一开始就做复杂布局，会把重点从“导出链路”转到“视觉排版”
- 处理：这一轮只做最小可用 PDF，把接口和服务边界先固定下来

## 可沉淀为教程 / 博客的点

- 为什么 PDF 导出最好放在 Markdown 导出之后做
- 如何让 PDF 和 Markdown 共用同一份内容来源
- 服务端 PDF 导出为什么比前端浏览器导出更稳定
- 如何把“最小可用 PDF”与“复杂模板系统”拆成两阶段

## 后续待办

- 关闭 `issue-18`
- 继续 `issue-19`：`web/admin` 下载入口
- 评估 M5 收官时是否补一篇教程大纲
