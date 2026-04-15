# 开发日志

- Issue：#147
- 里程碑：M14 编辑体验与亮点表达重构
- 分支：`fys-dev/feat-m14-issue-147-149-hero-skills-followup`
- 日期：2026-04-06

## 背景

公开简历侧栏已经恢复了头像翻转与 slogan 的视觉表达，但这些内容仍然写死在前端组件里，后台无法编辑，也无法进入草稿、发布和导出的统一链路。

## 本次目标

- 扩展共享简历契约，为 `profile.hero` 建立稳定结构。
- 让 admin 可以编辑头像前后图、跳转链接和双语 slogan。
- 保证旧 draft / published 快照缺失 `hero` 时仍可正常读取与发布。

## 非目标

- 不做图片上传、裁剪和存储桶接入。
- 不扩展新的发布接口或后台页面。

## TDD / 测试设计

- 在共享类型和 fixture 中先补 `profile.hero`。
- 在 server 侧补领域校验与 legacy snapshot 兼容测试。
- 在 admin 侧补 hero 配置保存测试，验证 payload 能正确带出图片地址、链接与双语 slogan。

## 实际改动

- 在 `packages/api-client`、`apps/admin`、`apps/web` 中补充 `ResumeProfileHero` 与 `profile.hero`。
- 在 `apps/server` 中引入 `normalizeStandardResume`，对旧快照缺失 hero 的情况自动补默认值。
- 在 `ResumePublicationService` 中统一归一化 draft / published / update payload。
- 在 `ResumeDraftEditorPanel` 中新增“侧栏主视觉”编辑区，并把英文 slogan 放进翻译工作区。

## Review 记录

- 本次改动只围绕共享契约、读取兼容和后台可编辑化，没有顺手扩展上传能力或新 UI 轮次。
- `normalizeStandardResume` 可复用为后续 resume schema 平滑演进的统一入口，已优先收口到领域层与发布服务层。

## 自测结果

- `pnpm --filter @my-resume/server test` ✅
- `pnpm --filter @my-resume/server typecheck` ✅
- `pnpm --filter @my-resume/admin test` ✅
- `pnpm --filter @my-resume/admin typecheck` ✅

## 遇到的问题

- 英文多行文案在翻译工作区里清空后会破坏中文行结构。
- 通过调整 `mergeLocalizedLines(...)` 的合并逻辑，改为按原始行位次保留中文结构后解决。

## 可沉淀为教程/博客的点

- 标准简历 schema 如何做“向后兼容字段扩展”。
- 为什么在服务端读取层做归一化，比要求手工迁移本地 SQLite 数据更适合教程型项目。

## 后续待办

- 由 `#148` 消费新的 `profile.hero`，继续收侧栏与正文结构展示。
- 后续若要支持头像上传，再单开 issue 设计媒体资源链路。
