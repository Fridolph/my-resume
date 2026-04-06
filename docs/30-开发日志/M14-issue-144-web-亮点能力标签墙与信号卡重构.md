# M14 / issue-144 开发日志：web 亮点能力标签墙与信号卡重构

- Issue：`#144`
- 里程碑：`M14 编辑体验与亮点表达重构`
- 分支：`fys-dev/feat-m14-issue-144-web-highlights-signal-cards`
- 日期：`2026-04-06`

## 背景

公开简历的亮点区之前沿用了和“工作经历 / 项目经历”相近的 `timeline` 风格：

- 看起来像又一段经历列表
- 与真正的项目、工作经历视觉重复
- 不能直接强调“前端 / 全栈 / AI / 工程质量 / 写作开源”这些能力信号
- 当亮点条目增多时，阅读者很难快速抓到重点

这会让亮点区变成“又一组描述”，而不是“能力结论”。

## 本次目标

- 让亮点区不再复用 timeline 结构
- 改成更轻、更聚焦的能力信号表达
- 保持 `zh / en` 切换继续正常
- 不改其他简历模块布局

## 非目标

- 不引入复杂图表库
- 不重做工作经历 / 项目经历模块
- 不修改亮点数据结构

## 实际改动

### 1. 把亮点区改成独立视觉模块

更新：

- [published-resume-highlights-section.tsx](/Users/fri/Desktop/personal/my-resume/apps/web/components/published-resume/published-resume-highlights-section.tsx)

本轮直接把亮点区从原来的 `PublishedResumeSectionCard + timeline` 改成了独立 section：

- 顶部保留模块标题与说明
- 左侧新增“信号说明”和能力标签摘要
- 右侧改成能力信号卡网格

这样阅读者会明显感知到：

- 工作经历 / 项目经历是在讲“发生过什么”
- 亮点区是在讲“这个人最值得记住的能力信号是什么”

### 2. 为亮点卡增加能力归类

新增了一组轻量信号归类规则：

- 前端架构
- 全栈交付
- AI 工程化
- 工程质量
- 团队协作
- 写作开源

组件会根据亮点标题和描述中的关键词，把条目映射到对应信号，并为每张卡生成：

- badge
- 渐变强调背景
- 一组补充 signal tags

这不是复杂的推荐系统，而是一层稳定、可解释的视觉编码。

### 3. 调整测试 fixture，让亮点区更接近真实表达

更新：

- [resume-published-fixture.ts](/Users/fri/Desktop/personal/my-resume/apps/web/components/__tests__/resume-published-fixture.ts)

为了让测试能覆盖多种能力信号，本轮把 fixture 里的亮点改成了更接近当前项目方向的三类内容：

- 前端架构落地
- AI 工程化实践
- 技术写作与开源

这也更符合现在仓库真实想表达的开源定位。

### 4. 用测试锁住中英文信号表达

更新：

- [published-resume-shell.spec.tsx](/Users/fri/Desktop/personal/my-resume/apps/web/components/__tests__/published-resume-shell.spec.tsx)

本轮补充确认了：

- 中文首页能看到亮点信号卡标题
- 中文下能力信号 badge 已经出现
- 切到英文后，对应英文标题和英文信号 badge 继续正确显示

## Review 记录

### 是否符合当前 issue 目标

符合。

这轮只动了亮点区，没有顺手改工作经历、项目经历或其他展示模块。

### 为什么亮点区不再继续用 timeline

因为亮点区的职责不是讲时间顺序，而是直接回答招聘方最关心的判断：

- 这个候选人最强的能力信号是什么
- 哪些信号值得继续追问

继续用 timeline，只会让它继续被误读成“另一组经历”。

### 为什么采用“信号卡 + 标签墙”

因为这种表达天然更适合：

- 先扫一眼抓关键词
- 再按兴趣深入读单张卡片

而且它和工作经历 / 项目经历的视觉语义差异足够明显，不容易互相抢戏。

## 自测结果

已执行：

- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/web typecheck`

结果：

- 单元测试通过
- 类型检查通过

## 后续可沉淀为教程的点

- 为什么亮点区应该表达“能力信号”，而不是继续堆“经历描述”
- 如何用轻量规则把亮点条目映射成更稳定的视觉信号
- 为什么公开简历里，某些模块要强调“可扫读性”而不是“信息对称性”
