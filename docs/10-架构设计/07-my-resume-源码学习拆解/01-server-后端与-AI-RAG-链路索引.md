# my-resume：server 后端与 AI / RAG 链路索引

## 一、这份索引写给谁

这份文档是给后续继续学习 `server` 线时用的入口索引。

当前 `server` 相关的源码理解，已经先整理在下面这份文档中：

- `docs/10-架构设计/06-my-resume-AI-RAG-学习引导与真实链路说明.md`

这份文档主要覆盖：

- `apps/server` 中 AI / RAG 当前的真实闭环
- Provider / controller / service / repository 的基本组织方式
- RAG 索引、检索、问答和状态接口

## 二、当前建议阅读顺序

### 1. 先看 AI / RAG 学习引导

- `docs/10-架构设计/06-my-resume-AI-RAG-学习引导与真实链路说明.md`

### 2. 再结合源码走读以下目录

- `apps/server/src/main.ts`
- `apps/server/src/app.module.ts`
- `apps/server/src/database/`
- `apps/server/src/modules/auth/`
- `apps/server/src/modules/resume/`
- `apps/server/src/modules/ai/`

## 三、后续准备继续补的主题

- `controller -> service -> repository` 进一步逐接口拆解
- `SQLite / libsql / drizzle` 当前在 `my-resume` 中到底如何运作
- `resume draft / publish snapshot / summary snapshot` 三层数据视图的边界
- `AI / RAG` 与常规简历业务链路如何共存于一个 `server`

## 四、说明

本目录后续会继续把 `server` 的源码梳理逐步拆细。

但当前为了避免和已经存在的 AI / RAG 学习引导重复，先以索引方式承接。
