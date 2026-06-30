# M30-M31 Agentic RAG 对话引擎升级 — 开发日志

## 背景

my-resume 的 AI Chat 对话引擎（`AiChatGraphService`）自 M26 引入以来，一直使用正则匹配 + 硬编码规则做路由判断。随着 Agentic RAG 学习深入（LangGraph query-router → multihop），决定用 LangGraph StateGraph 重写整个对话引擎。

## 本次目标

将对话引擎从"手工方法调用链"升级为"LangGraph StateGraph"，引入 LLM 语义路由、检索评估、多跳拆解三大能力。

## 实际改动

### M30: 基础引擎升级

| Issue | 改动 | 文件数 |
|-------|------|--------|
| 30-1 | 安装 `@langchain/langgraph`，定义 `Annotation.Root` GraphState（21字段），灰度常量 | 5 |
| 30-2 | 实现 route_intent (LLM withStructuredOutput 6策略)、direct_answer、retrieve、rag_generate 4节点 + afterRoute 条件边 | 9 |
| 30-3 | 增加 evaluate 评估节点 + fallback_answer 兜底 + afterEvaluate 条件边 | 5 |

### M31: 多跳检索

| Issue | 改动 | 文件数 |
|-------|------|--------|
| 31-1 | decompose 节点（纯逻辑判断）+ decompose_question 节点（LLM 拆子问题）+ afterDecompose 条件边 | 4 |
| 31-2 | plan_next 节点（LLM+硬性双重保险）+ afterPlan 条件边 + 🔄 retrieve↔plan_next 回边 | 3 |
| 31-3 | mergeUnique 多轮去重 + 开发日志 | 1 |

### 最终图结构（8节点 + 🔄 回边）

```
START → route_intent (LLM)
          ├─ chitchat/guide/out_of_scope → direct_answer → END
          └─ resume/supplement/hybrid → decompose
                ├─ simple → retrieve
                └─ complex → decompose_question (LLM) → retrieve
                                                              │
                                                              ▼
                                                        plan_next (LLM)
                                                  ┌─────────┴─────────┐
                                                  ▼                   ▼
                                            retrieve (🔄)        evaluate (LLM)
                                                                ┌───┴───┐
                                                                ▼       ▼
                                                          rag_generate  fallback_answer
```

## 关键设计决策

1. **routerLlm 分离**：结构化输出需要关 thinking，与常规生成 llm 分开实例
2. **灰度开关**：`AI_CHAT_USE_LANGGRAPH` 环境变量控制，false 时走旧引擎；LangGraph 异常时自动回退旧引擎
3. **旧代码不删**：`generateAnswerLegacy()` 完整保留，作为灰度回退
4. **decompose 纯逻辑**：第一层判断不用 LLM（减少调用），只判断多目标信号/并列结构
5. **plan_next 双重保险**：硬性规则（超上限/无剩余）+ LLM 判断，LLM 异常时兜底

## 遇到的问题

1. **pnpm store 迁移**：`@langchain/langgraph` 安装时遇到 store location mismatch，通过 `pnpm install` 重新 link 解决
2. **peer dependency**：`@langchain/langgraph@1.4.7` 需要 `@langchain/core@^1.1.48`，升级 core 到 1.2.1 解决
3. **导入路径**：`ai-chat-graph.state.ts` 中相对路径写成 `../../rag/` 而非 `../rag/`，typecheck 发现并修复

## 测试与验证

- `pnpm typecheck`: 新增文件零错误（已有测试文件的 mock 问题是遗留）
- `pnpm test --filter=@my-resume/server`: 63 files / 295 tests 全部通过
- 灰度开关默认 `false`，线上不受影响

## 后续教程切入点

- "从正则路由到 LLM 路由：Agentic RAG 的第一步" — 对应 route_intent 节点
- "LangGraph 三要素实战：State/Node/Edge 在真实项目中的落地"
- "双重保险模式：LLM 判断 + 硬性规则兜底" — 对应 plan_next 节点
- "回边的威力：retrieve ↔ plan_next 循环如何实现多跳检索"
