# M12 / issue-138 开发日志：公开站 header 导航与双栏简历布局收口

- Issue：`#138`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/feat-m12-issue-136-web-heroui-public-site-upgrade`
- 日期：`2026-04-03`

## 背景

上一轮已经把 `apps/web` 切到 `HeroUI + Tailwind v4`，也建立了首页、`/profile` 和 `/ai-talk` 的公开站结构。

但首页还有两个明显不顺手的地方：

- header 仍然偏“展示壳”，不是一个真正适合长期维护的公开站导航
- 简历正文没有回到最自然的阅读结构，桌面端缺少“左侧基本信息 / 右侧正文”的稳定阅读节奏

因此这轮的重点不是再加功能，而是把公开站主页收口到更像一份真正可公开投递、可直接阅读的简历页。

## 本次目标

- 将 header 收口为更轻的 sticky 导航
- 将语言切换、明暗切换、GitHub 链接与下载入口统一放进 header
- 让首页只保留简历正文内容
- 将主页恢复为移动优先、桌面双栏的简历阅读布局
- 保持现有主题切换、语言切换与导出链路可用

## 非目标

- 不改 `apps/server` API
- 不扩展真实 RAG / AI Talk 能力
- 不重构 `/profile` 的信息架构
- 不进入 Figma 精修或多模板系统

## 实际改动

### 1. 收口 header 为真正的公开站导航

更新：

- `apps/web/components/public-site-header.tsx`
- `apps/web/components/published-resume/published-resume-utils.ts`

本轮把 header 改成了更明确的四部分：

- 左侧品牌标识
- 中间主导航（简历 / 履历概览 / AI Talk）
- 右侧状态与操作（公开简历、当前版块、下载）
- 语言切换、主题切换与 GitHub 入口

这样页面主内容就不需要再重复展示“当前版块”和导出按钮。

### 2. 首页恢复为更自然的简历阅读布局

更新：

- `apps/web/components/published-resume-shell.tsx`
- `apps/web/components/published-resume/published-resume-hero.tsx`
- `apps/web/app/globals.css`

结构调整后：

- 移动端：从上到下自然流式阅读
- 平板与桌面端：左侧固定展示基本信息，右侧展示正文模块

正文顺序保持为：

- 教育经历
- 公司经历
- 项目经历
- 技能结构
- 补充亮点

其中左侧信息卡重点承载：

- 姓名、标题、简介
- 联系方式
- 公开链接
- 兴趣标签
- 发布时间

### 3. 把下载行为从正文迁移到 header

之前下载入口放在 hero 区，会让首页显得像“宣传卡片 + 内容列表”。

本轮把下载行为移动到 header 后，首页正文只承担简历阅读任务，阅读路径更稳定：

- header 负责跳转、切换和下载
- 正文负责完整展示履历内容

### 4. 补齐测试断言

更新：

- `apps/web/components/__tests__/published-resume-shell.spec.tsx`

新增或继续覆盖：

- GitHub 仓库入口
- 语言切换后导航文本变化
- 导出链接继续随语言切换变化
- 主题切换链路不受影响

## Review 记录

### 是否符合当前 issue 目标

符合。

本轮只处理公开站 header 与简历阅读布局，没有继续扩展到 server 或其他里程碑内容。

### 是否还有可继续抽离的空间

有，但本轮先不做：

- header 后续仍可沉淀成更稳定的公开站壳组件
- 左侧基本信息卡后续可以继续抽成共享展示组件
- 如果后面继续做 web 端主题或模板系统，可以再统一整理 section card 和 sidebar card 的视觉 tokens

当前先优先保证“公开简历阅读主线”收住。

## 自测结果

已按顺序执行：

- `pnpm --filter @my-resume/web build`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web test`

结果：

- 构建通过
- 类型检查通过
- 单元测试通过

## 后续可沉淀为教程的点

- 为什么公开站的 header 应该尽量只做导航、切换和下载，不抢正文阅读节奏
- 为什么简历主页更适合移动优先、桌面双栏而不是统一堆叠式营销布局
- 为什么把“基本信息卡”和“正文模块”职责分离后，更利于后续做主题模板扩展
