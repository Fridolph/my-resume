# M25：AI Intro 页面源码拆解

## 入口

- 页面入口：`apps/web/app/[locale]/ai-talk/intro/page.tsx`
- 主壳组件：`apps/web/app/[locale]/ai-talk/intro/_intro/intro-shell.tsx`
- 主题配置：`apps/web/app/[locale]/ai-talk/intro/_intro/intro-topic-config.ts`
- 右侧解锁面板：`apps/web/app/[locale]/ai-talk/intro/_intro/intro-unlock-map.tsx`
- Answer Block Renderer：`apps/web/app/_shared/ai-chat/ai-chat-answer-block-renderer.tsx`

## 数据流

1. `page.tsx` 读取公开简历快照，并把 `publishedResume` 传入 `AiTalkIntroShell`。
2. `AiTalkIntroShell` 从 localStorage 恢复 `completedTopics`。
3. 用户点击预设问题后，主题 key 被追加到 `completedTopics`。
4. 左侧线程根据 `completedTopics` 拼出本地问答预览。
5. 右侧 `IntroUnlockMap` 根据同一份 `completedTopics` 点亮主题碎片。
6. `resetProgress` 清空 `completedTopics`，页面回到可重新演示状态。

## 为什么先用预设问题

M25 的目标是先建立“引导式了解我”的前端承载面，而不是一开始就让开放问题把体验发散。预设问题有三个好处：

- 容易控制节奏，10 步流程天然对应右侧 10 块解锁地图。
- 容易做桌面 / 移动端验收，不依赖后端和模型稳定性。
- 为 M26 的 LangGraph 多域 RAG 留出清晰接入点：后续可以把本地答案替换为按 topic 路由后的真实结构化回答。

## 与现有 AI Chat 的关系

- AI Chat Drawer 负责开放式多轮对话。
- AI Intro 页面负责预设问题驱动的“游戏化介绍”。
- 二者共享公开站视觉语言，并可复用 `AiChatAnswerBlockRenderer` 展示结构化回答。

## M26 接棒点

- 将 `IntroTopicKey` 映射到 LangGraph 路由节点。
- 根据 topic 查询不同知识域：简历核心、项目经历、兴趣爱好、文章创作等。
- 将模型输出收敛为 `answerBlocks`，由现有 renderer 展示项目卡、兴趣卡、文章卡和媒体卡。
