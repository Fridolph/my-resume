# M12 / issue-141 开发日志：工作项目全 schema 收口与发布验证

- Issue：`#141`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/feat-m12-issue-140-141-resume-editor-closeout`
- 日期：`2026-04-05`

## 背景

在 `issue-140` 之后，后台编辑器已经补齐了教育、技能、亮点、个人链接和兴趣方向，但仍然存在两个真实缺口：

- `projects.links` 还没有进入后台编辑闭环
- `validateStandardResume` 还停留在 `profile` 级别，无法稳定兜住完整标准简历结构

这意味着“后台能维护完整简历”和“服务端能识别完整合法结构”之间还差最后一层收口。

## 本次目标

- 补齐 `projects.links` 的后台编辑能力
- 把后台与编辑页文案统一为“完整标准简历模块编辑”
- 扩展服务端 `validateStandardResume` 到完整结构校验
- 用测试证明“保存草稿 -> 发布 -> 公开读取快照更新”的链路已经能覆盖新增模块

## 非目标

- 不新增后端接口
- 不修改现有 `draft / publish / published` API 路径
- 不引入拖拽排序
- 不重做 `web` 展示信息架构

## 实际改动

### 1. 补齐 `projects.links` 后台编辑能力

更新：

- `apps/admin/components/resume-draft-editor-panel.tsx`

本轮为项目经历补充了：

- 项目链接新增
- 项目链接删除
- `label.zh / label.en / url` 成对字段维护

同时把编辑器标题和描述收口为“完整标准简历模块编辑”，避免页面文案仍停留在“关键模块”或“部分模块”的旧状态。

### 2. 更新后台模块说明

更新：

- `apps/admin/components/admin-resume-shell.tsx`

把项目经历模块的说明同步到真实能力，明确当前已经支持：

- 项目名称
- 角色
- 时间
- 摘要
- 亮点
- 技术栈
- 项目链接

这样后台总览和编辑器正文的状态表达保持一致。

### 3. 扩展服务端标准简历结构校验

更新：

- `apps/server/src/modules/resume/domain/standard-resume.ts`

本轮把 `validateStandardResume` 从仅校验 `profile` 扩展为覆盖完整结构校验，重点包括：

- `LocalizedText` 字段必须保持 `{ zh, en }`
- `education / experiences / projects / skills / highlights` 必须是数组
- `profile.links / projects.links` 必须包含 `label` 和 `url`
- `technologies / keywords` 必须是字符串数组

保持了 v1 的边界：这次只做结构合法性校验，不引入复杂业务规则和长度限制。

### 4. 用测试锁住保存、发布与快照更新行为

更新：

- `apps/admin/components/__tests__/resume-draft-editor-panel.spec.tsx`
- `apps/server/src/modules/resume/domain/standard-resume.spec.ts`
- `apps/server/src/modules/resume/resume-publication.service.spec.ts`

新增覆盖：

- 项目链接新增与保存 payload
- 非法数组、非法双语字段、非法 links / keywords / technologies 的结构校验
- 已发布内容在重新发布前保持稳定
- 重新发布后，教育、工作、项目、技能、亮点、个人链接、兴趣方向等模块都能进入公开快照

## Review 记录

### 是否符合当前 issue 目标

符合。

本轮只围绕 `projects.links`、服务端结构校验和发布链路验证展开，没有扩展到新的 schema，也没有重做展示页。

### 是否有可进一步抽离的空间

有，但先不做：

- `profile.links` 与 `projects.links` 的编辑卡片后续可抽成通用链接编辑子组件
- 各模块的列表编辑区块后续可继续拆分成更小的 section 组件
- 领域校验后续若继续增长，可整理成更明确的校验辅助模块

当前优先级仍然是先把“完整 schema 编辑闭环”稳稳收住。

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server typecheck`

结果：

- 测试通过
- 类型检查通过

## 后续可沉淀为教程的点

- 为什么“后台可编辑闭环”和“服务端结构校验”要一起收口
- 为什么教程型项目里先做结构合法性校验，比先做复杂业务规则更合适
- 如何用发布快照测试证明“保存草稿不影响公开内容，发布才会切换公开版本”
