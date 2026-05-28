# M23 PR - 情绪检测与输入安全门控

## 背景

AI Chat 上线后，公开站访客可以自由提问。虽然已有 Prompt 层面的内容限制和 RAG 低分门控，但缺少对辱骂、恶意引导、纯负面发泄等不安全输入的拦截。

参考 LangChain `RunnableBranch` 模式（见 `step8.mjs` 中的 `moodChain`），本次在 RAG 检索前增加一层输入安全检测，同时更新 System Prompt 使 AI 在答复简历相关但带有负面情绪的问题时表现出共情。

## 本次目标

- 新增三层输入检测：辱骂拒绝 / 打招呼引导 / 放行
- 辱骂/恶意关键词直接拒答并引导建设性提问
- System Prompt 加入语气指引：遇到沮丧/焦虑等情绪时先共情再回答
- 纯负面发泄（无具体问题）温和引导回正轨

## 非目标

- 不做 LLM 级情绪分类（避免额外延迟和成本）
- 不引入第三方敏感词库
- 不改变已有的打招呼/短输入引导逻辑

## 实际改动

### `rag.service.ts`

- 重命名 `detectGreetingRedirect` → `detectRedirect`
- 新增**第 1 层：辱骂/恶意检测**（中英文关键词匹配）
  - 命中后返回引导文案："欢迎以建设性的方式提问"
  - 在 RAG 检索前直接短路，不调用 LLM
- 保留**第 2 层：打招呼/极短输入引导**（原逻辑不变）

### `rag-ask.prompt.ts`

- System Prompt 新增 `TONE GUIDANCE` / `语气指引` 段落：
  - 沮丧/焦虑/自我怀疑 → 先共情，再基于简历事实回答
  - 纯发泄无提问 → 温和引导回正轨
  - 保持真诚、支持、专业

### 判定流程

```
用户输入
  → detectRedirect()
    ├─ 第 1 层：辱骂关键词？ → 拒答引导（不调 LLM）
    ├─ 第 2 层：打招呼/极短？ → 友好引导（不调 LLM）
    └─ 通过 → RAG 检索 → LLM 生成（System Prompt 含情绪指引）
```

### 参考来源

LangChain `step8.mjs` 中的 `moodChain`：

```js
const moodPrompt = PromptTemplate.fromTemplate('判断情绪，只回积极/消极/中性：\n{question}')
const moodChain = RunnableSequence.from([moodPrompt, model, new StringOutputParser()])
```

本次采用关键词匹配而非 LLM 分类，原因：
- AI Chat 场景对延迟敏感，额外 LLM 调用会增加 2-3 秒
- 辱骂关键词覆盖面可控，且可与正面回答的 System Prompt 配合

## Review 记录

- 关键词列表仅为基础覆盖，不声称穷举
- 未来可升级：接入 LLM 情绪分类作为第 2 层（关键词过滤为第 1 层）
- 辱骂回复文案保持礼貌专业，不激化矛盾

## 测试与验证

```bash
pnpm --filter @my-resume/server test -- src/modules/ai/rag/__tests__/rag.service.spec.ts
pnpm --filter @my-resume/server test -- src/modules/ai/rag/prompts/__tests__/rag-ask.prompt.spec.ts
pnpm --filter @my-resume/server typecheck
```

## 后续建议

- 将关键词列表抽象为可配置的外部文件或环境变量
- 当用户积累足够聊天数据后，可训练一个轻量分类模型替换关键词匹配
- 可接入云服务商的内容安全 API 做更精准的违规检测
