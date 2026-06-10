# M25 / issue #221：AI Intro 独立页面与双栏交互壳

## 背景

M23 已经完成公开站全局 AI Chat Drawer 与 RAG 问答 MVP。下一阶段希望保留头像 Quick Ask，同时新增一个独立的 AI Intro 页面，用更强的前端表达承接“预设问题 + 人物画像逐步解锁”的体验。

## 本次目标

- 新增 `/{locale}/ai-talk/intro` 独立页面。
- 复用现有 `AiTalkPageFrame`、公开站 header、发布简历快照同步与 i18n 结构。
- 建立左侧引导式聊天窗口与右侧 10 块解锁地图的双栏壳。
- 补充最小组件测试，确保页面壳、聊天预览和 10 个主题碎片稳定渲染。

## 非目标

- 不实现预设问题点击状态机。
- 不调用真实 AI 问答接口。
- 不做拼图点亮逻辑。
- 不接入 LangGraph 或多域 RAG。

## 实际改动

- 新增 `apps/web/app/[locale]/ai-talk/intro/page.tsx`。
- 新增 `apps/web/app/[locale]/ai-talk/intro/_intro/intro-shell.tsx`。
- 新增 `apps/web/app/[locale]/ai-talk/intro/_intro/__tests__/intro-shell.spec.tsx`。
- 为中英文 `aiTalk.json` 增加 `introPage` 文案。
- 更新 `ai-talk` README，记录新增 intro route-private 模块。

## Review 记录

- 页面只消费已发布简历快照，不新增数据源。
- `intro-shell.tsx` 为 192 行，未触发 TSX 类型拆分阈值。
- prompt 样例暂时只作为 UI 槽位展示，后续 #222 再接交互状态机。
- 右侧 10 块解锁地图为静态壳，后续 #223 再接点亮逻辑与动效完善。

## 测试与验证

- `pnpm --dir apps/web exec vitest run 'app/[locale]/ai-talk/intro/_intro/__tests__/intro-shell.spec.tsx'`
- `pnpm --filter @my-resume/web typecheck`
- `git diff --check`

以上均通过。

## 遗留风险与后续

- 入口页暂未把 AI Intro 加入 hub 卡片，后续可以在体验收口时决定是否显式暴露。
- 当前页面未做浏览器人工截图验证，后续 #222 / #223 接入真实交互后再集中做桌面与移动端视觉验收。
- AI Intro 的真实回答、状态恢复与解锁结果应分别在 #222、#223、#224 中推进。

