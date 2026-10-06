# features/ — 业务域

每个业务域是一个**自治单元**，目录结构统一：

```
features/<domain>/
├── components/   # 域内展示/容器组件
├── hooks/        # 域内 hooks（含数据操作）
├── apis/         # 域内数据请求（调用 @my-resume/api-client 或 shared/lib/http）
├── constants/    # 域内常量
└── types/        # 域内类型
```

## 规则

- 域内可依赖 `shared/`、`utils/`、`config/`、`types/`。
- **域之间禁止互引**；共享能力上移 `shared/`。
- 一个域对外只暴露「容器组件」或明确的入口，内部实现不外泄。

## 规划的域（后续迁移 issue 逐个落地）

| 域 | 对应功能 | 迁移 Issue |
|---|---|---|
| `resume` | 简历草稿编辑 / 发布 | #286 |
| `ai` | AI 工作台（分析 / RAG 管理 / 导入等） | #287 |
| `publish` | 发布与导出 | #288 |
| `governance` | Chat 治理 | #288 |
