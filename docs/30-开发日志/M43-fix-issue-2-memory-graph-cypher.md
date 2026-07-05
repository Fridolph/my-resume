# M43-fix Issue 2: MemoryGraphStore.search() 解析简单 MATCH 语句

## 背景

当前 `MemoryGraphStore.search()` 忽略 LLM 生成的 Cypher，永远做全量二跳遍历：
```ts
// 当前行为：不管 Cypher 是什么，返回所有 person 的二跳邻居
async search(_cypher: string) { ... }
```

这导致图检索精度很低——LLM 生成的精确 MATCH 语句被丢弃，返回大量无关信息。

## 目标

让 MemoryGraphStore 解析简单的 MATCH/RETURN 语句，定向遍历图。

## 非目标

- 不做完整 Cypher 解析器（过于复杂）
- 不改变 Neo4jGraphStore（它直接执行 Cypher）
- 不改变 GraphStore 接口

## 改动范围

```
apps/server/src/modules/ai/graph/memory-graph-store.ts
  └─ search() 方法重写：
     1. 解析 MATCH 中的节点类型和关系类型 → 定向遍历
     2. 无 MATCH 或解析失败 → 回退到现有全量遍历
```

## 技术思路

```ts
// 从 Cypher 中提取：MATCH (p:Person)-[:任职于]->(c:Company)
//         → 定向遍历：从 person 出发，只走"任职于"关系
//         → 找到 Company 节点 → 返回属性
//
// 简单解析器：
// 1. 正则提取节点标签 (p:Person) → 目标节点类型
// 2. 正则提取关系类型 [:任职于] → 遍历方向
// 3. 在 graphology 图中定向匹配
```

## 验收标准

- [ ] 问"我在哪些公司工作过？" → Cypher `MATCH (p:Person {name:"xxx"})-[:任职于]->(c:Company) RETURN c.name` → 返回精确公司列表
- [ ] 复杂 Cypher 无法解析时 → 回退到全量遍历
- [ ] 不引入新的 npm 依赖
- [ ] typecheck + 测试通过

## 测试计划

- 单元测试：模拟 StandardResume 建图 → 验证常见 Cypher 模式解析
- 手工测试：问关系型问题，对比解析前后检索结果

---
