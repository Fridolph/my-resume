# M7 / issue-32 开发日志：旧版简历内容迁移到标准模型

- Issue：#56
- 里程碑：M7 展示层与内容接入：从联调壳到真实页面
- 分支：`feat/m7-issue-32-legacy-resume-migration`
- 日期：2026-03-25

## 背景

当前三端虽然已经能跑通，但 `apps/server` 中的示例简历仍然只是占位内容。只要这一点不改，整个项目就还停留在“脚手架演示”，没有真正进入“我的简历重构”阶段。

本次任务的重点不是引入数据库、后台复杂迁移工具或商业版变体能力，而是把旧版 Vue 简历中的真实内容，安全迁移到当前的 `StandardResume` 双语模型里，让后续 `admin / web / export` 读到的是同一份真实简历数据。

## 本次目标

- 盘点旧版 Vue 简历内容来源
- 将旧版内容映射到 `StandardResume`
- 替换后端内置示例简历为真实个人简历
- 保持导出与既有测试链路仍然可用

## 非目标

- 不引入数据库持久化
- 不做 JD 多版本定制
- 不新增商业版字段模型
- 不在本次实现页面视觉升级

## TDD / 测试设计

本次不是新增接口，而是替换“标准样例内容”，所以测试重点放在：

- `standard-resume` 领域模型仍然合法
- Markdown 导出仍能正确渲染真实迁移后的内容
- PDF 导出仍然可生成有效文件

对应执行：

- `apps/server/src/modules/resume/domain/standard-resume.spec.ts`
- `apps/server/src/modules/resume/resume-markdown-export.service.spec.ts`
- `apps/server/src/modules/resume/resume-pdf-export.service.spec.ts`

并同步更新了 Markdown 导出断言，使其不再依赖旧的占位示例公司与描述。

## 实际改动

### 1. 盘点旧版内容来源

本次主要以两个来源作为迁移依据：

- `public/web_fuyinsheng_8y.md`
- `src/locales/zh/index.ts` / `src/locales/en/index.ts`

前者提供了较完整的中文简历内容和模块顺序，后者提供了旧版站点已经存在的一部分英文映射。这样可以避免完全重新编写英文文案，尽可能保留旧项目中的原始表达。

### 2. 将内容映射到标准模型

更新：

- `apps/server/src/modules/resume/domain/standard-resume.ts`

主要完成：

- profile：姓名、标题、摘要、位置、邮箱、电话、站点、外链、兴趣
- education：四川大学锦江学院 / 通信工程
- experiences：一蟹科技、网思科平、爱礼科技三段经历
- projects：云药客 SaaS、悬壶医讯、EDR、综合管理后台、安全分析大屏、环球礼仪知识平台、my-resume
- skills：前端基础与框架、工程化与质量、UI 与可视化、服务端与安全
- highlights：个人项目与知识沉淀、开源参与、团队建设与规范实践

为了减少重复书写，本次顺手补了 `createLocalizedText()`，让双语字段构造更清晰。

### 3. 更新导出测试断言

更新：

- `apps/server/src/modules/resume/resume-markdown-export.service.spec.ts`

测试从原先依赖“示例科技 / Example Tech”这类占位内容，改为断言真实迁移后的公司、项目与技能片段，确保迁移结果能被导出链路真实消费。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只处理了旧版简历内容到 `StandardResume` 的迁移，没有扩展到：

- 数据库存储
- 后台批量迁移工具
- JD 多版本简历
- 页面样式重设计

### 是否可抽离组件、公共函数、skills 或其他复用能力

已做的最小抽离：

- 在领域模型中新增 `createLocalizedText()`，简化双语字段构造

当前不需要再抽独立“迁移脚本”或“legacy parser”，因为 v1 只做一份标准通用版简历，现阶段把迁移逻辑清楚地写在领域样例中，更适合教程阅读和维护。

### 本次最关键的设计判断

旧版内容迁移的目标，是让“标准模型承载真实内容”，而不是把旧 Vue 站的结构原样复制过来。

也就是说：

- 旧版是页面组织方式
- 新版是领域数据模型
- 迁移时要做结构映射，而不是字段照搬

这一步做对了，后续 `admin`、`web`、`export` 才能围绕同一份稳定数据继续演进。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server test -- --runInBand src/modules/resume/domain/standard-resume.spec.ts src/modules/resume/resume-markdown-export.service.spec.ts src/modules/resume/resume-pdf-export.service.spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

结果：全部通过。

## 遇到的问题

### 1. 旧版内容来源分散

问题：旧版中文主内容在 Markdown，英文内容与部分补充语义在 `src/locales` 中，信息不是单一来源。

处理：

- 以 Markdown 为中文主基线
- 以 `src/locales/en` 作为英文补充来源
- 对个别缺失的英文描述做最小补齐，但不额外扩展商业版字段

### 2. 标准模型与旧版页面结构并不一一对应

问题：旧版有“个人项目 / 参与开源 / 最近文章”等页面表达，而标准模型更偏向统一的数据块。

处理：

- 工作项目进入 `projects`
- 个人项目与开源沉淀进入 `highlights`
- 不额外新增模型字段，避免破坏 v1 结构稳定性

## 可沉淀为教程/博客的点

- 如何从旧前端页面内容反推标准数据模型
- 内容迁移时为什么更应该“映射结构”，而不是“照搬页面”
- 双语简历项目如何利用旧版 i18n 文案为新模型服务

## 后续待办

- 继续 `M7 / issue-33`：web 公开简历页面模块化渲染
- 再推进 `M7 / issue-34`：展示层整理，为 UI 升级预留边界
- M7 收尾时补里程碑教程大纲
