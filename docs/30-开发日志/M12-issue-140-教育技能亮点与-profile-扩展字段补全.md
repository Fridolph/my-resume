# M12 / issue-140 开发日志：教育技能亮点与 profile 扩展字段补全

- Issue：`#140`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/feat-m12-issue-140-141-resume-editor-closeout`
- 日期：`2026-04-05`

## 背景

当前仓库里，`StandardResume` 的数据模型和公开页展示其实已经覆盖了完整的标准简历结构。

但后台编辑器还停留在“`profile` 为主，`experiences / projects` 部分可编辑”的状态，导致下面这些模块虽然存在于 schema 里，却没有真正进入后台维护闭环：

- `education`
- `skills`
- `highlights`
- `profile.links`
- `profile.interests`

这会让“数据模型完整”和“后台可维护”之间出现断层，也不利于后续教程和开源读者理解整个系统的主线。

## 本次目标

- 在后台补齐教育经历、技能组、亮点、个人链接、兴趣方向的编辑能力
- 保持现有草稿保存逻辑不变
- 更新后台模块说明，让页面状态和真实能力一致

## 非目标

- 不改 `apps/server` API 契约
- 不做排序 / 拖拽
- 不调整 `web` 展示结构
- 不进入 `projects.links` 与服务端结构校验收口，那部分留给下一张 issue

## 实际改动

### 1. 扩展 `ResumeDraftEditorPanel` 到更多标准模块

更新：

- `apps/admin/components/resume-draft-editor-panel.tsx`

本轮新增了以下编辑区块：

- 教育经历
- 技能组
- 亮点
- 个人链接
- 兴趣方向

其中继续沿用了当前编辑器已经建立好的输入约定：

- `LocalizedText[]` 用“每行一条”
- `string[]` 用“逗号分隔”
- 链接类结构用 `label.zh / label.en / url`

这样能保持教程型实现足够直接，也和当前 `experiences / projects` 的实现风格一致。

### 2. 补齐对应的空数据工厂和字段序列化

新增或扩展：

- `createEmptyProfileLink`
- `createEmptyEducation`
- `createEmptySkillGroup`
- `createEmptyHighlight`
- `buildDraftFieldValues` 对新模块的字符串态同步

这部分的目的不是抽象出一套复杂表单框架，而是保持最小状态管理策略仍能覆盖列表模块编辑。

### 3. 更新后台模块状态说明

更新：

- `apps/admin/components/admin-resume-shell.tsx`

把原来“只有 profile 可编辑”的旧文案改掉，更新为更贴近当前事实的说明：

- 基础信息已接通
- 教育经历已接通
- 工作经历已接通
- 项目经历已接通主字段
- 技能与亮点已接通

这样后台首页和编辑页的语义不再冲突。

### 4. 用测试把新增模块锁住

更新：

- `apps/admin/components/__tests__/resume-draft-editor-panel.spec.tsx`

这轮新增了对以下行为的测试：

- 新增教育经历并保存
- 新增技能组并保存关键词
- 新增亮点并保存标题与描述
- 新增个人链接并保存
- 维护兴趣方向的中英文内容并保存

这让编辑器从“部分模块可编辑”变成了“主模块进入真实闭环”。

## Review 记录

### 是否符合当前 issue 目标

符合。

本轮只围绕教育、技能、亮点、个人链接、兴趣方向和后台说明文案展开，没有扩展到 server 校验与 `projects.links`。

### 是否还有可继续抽离的空间

有，但这一轮先不做：

- 各类列表卡片后续可以继续抽成更小的编辑子组件
- 多个 `LocalizedText[]` / `string[]` 的序列化逻辑后续可继续整理
- 如果后面表单继续变复杂，再考虑更明确的 section-level 抽象

当前优先级仍然是“闭环先成立，再谈抽象”。

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`

结果：

- 单元测试通过
- 类型检查通过

## 后续可沉淀为教程的点

- 为什么完整 schema 和后台可编辑闭环必须同步推进
- 为什么列表型双语字段适合用“每行一条 / 逗号分隔”的低心智负担方案
- 为什么在教程型项目里，先保证模块真实可编辑，比先追求表单抽象更重要
