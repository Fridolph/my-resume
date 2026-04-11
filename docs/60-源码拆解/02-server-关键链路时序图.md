# server 关键链路时序图

本文只聚焦当前 `my-resume` 中最值得先看懂的 4 条链路：

- 登录鉴权
- 简历草稿保存与发布
- AI 分析
- RAG 检索与问答

建议结合以下源码一起看：

- `apps/server/src/main.ts`
- `apps/server/src/app.module.ts`
- `apps/server/src/modules/auth/`
- `apps/server/src/modules/resume/`
- `apps/server/src/modules/ai/`

## 1. 登录与 `/auth/me`

```mermaid
sequenceDiagram
    participant Admin as admin 前端
    participant AuthController as AuthController
    participant AuthService as AuthService
    participant JwtGuard as JwtAuthGuard

    Admin->>AuthController: POST /auth/login (username, password)
    AuthController->>AuthService: login(dto)
    AuthService->>AuthService: 校验 demo 账号 + 签发 JWT
    AuthService-->>AuthController: accessToken + user capabilities
    AuthController-->>Admin: 200 OK

    Admin->>JwtGuard: GET /auth/me + Bearer token
    JwtGuard->>AuthService: verifyAccessToken(token)
    AuthService-->>JwtGuard: authUser
    JwtGuard-->>AuthController: request.authUser
    AuthController-->>Admin: user + capabilities
```

对应源码：

- `apps/server/src/modules/auth/auth.controller.ts`
- `apps/server/src/modules/auth/auth.service.ts`
- `apps/server/src/modules/auth/guards/jwt-auth.guard.ts`

## 2. 草稿读取、保存与发布

```mermaid
sequenceDiagram
    participant Admin as admin 前端
    participant ResumeController as ResumeController
    participant JwtGuard as JwtAuthGuard
    participant RoleGuard as RoleCapabilitiesGuard
    participant ResumeService as ResumePublicationService
    participant ResumeRepo as ResumePublicationRepository
    participant DB as SQLite/Drizzle
    participant Web as web 前端

    Admin->>JwtGuard: GET /resume/draft + Bearer token
    JwtGuard-->>RoleGuard: authUser
    RoleGuard-->>ResumeController: canEditResume
    ResumeController->>ResumeService: getDraft()
    ResumeService->>ResumeRepo: findDraft()
    ResumeRepo->>DB: select resume_drafts
    DB-->>ResumeRepo: 当前草稿
    ResumeRepo-->>ResumeService: draft/null
    ResumeService-->>ResumeController: draft snapshot
    ResumeController-->>Admin: 草稿 JSON

    Admin->>ResumeController: PUT /resume/draft
    ResumeController->>ResumeController: validateStandardResume()
    ResumeController->>ResumeService: updateDraft(resume)
    ResumeService->>ResumeRepo: saveDraft(resume)
    ResumeRepo->>DB: upsert resume_drafts
    DB-->>ResumeRepo: saved draft
    ResumeRepo-->>ResumeService: saved draft
    ResumeService-->>ResumeController: draft snapshot
    ResumeController-->>Admin: 200 OK

    Admin->>ResumeController: POST /resume/publish
    ResumeController->>ResumeService: publish()
    ResumeService->>ResumeService: getDraft()
    ResumeService->>ResumeRepo: createPublishedSnapshot(draft)
    ResumeRepo->>DB: insert resume_publication_snapshots
    DB-->>ResumeRepo: published snapshot
    ResumeRepo-->>ResumeService: snapshot
    ResumeService-->>ResumeController: published snapshot
    ResumeController-->>Admin: 200 OK

    Web->>ResumeController: GET /resume/published
    ResumeController->>ResumeService: getPublished()
    ResumeService->>ResumeRepo: findLatestPublishedSnapshot()
    ResumeRepo->>DB: select latest snapshot
    DB-->>ResumeRepo: published snapshot
    ResumeController-->>Web: published resume
```

对应源码：

- `apps/server/src/modules/resume/resume.controller.ts`
- `apps/server/src/modules/resume/resume-publication.service.ts`
- `apps/server/src/modules/resume/resume-publication.repository.ts`
- `apps/server/src/database/schema.ts`

## 3. AI 分析与简历优化

```mermaid
sequenceDiagram
    participant Admin as admin AI 工作台
    participant AiController as AiReportController
    participant RoleGuard as RoleCapabilitiesGuard
    participant AiService as AiService
    participant Provider as Mock/OpenAI-Compatible Provider
    participant Cache as AnalysisReportCacheService
    participant Optimize as AiResumeOptimizationService
    participant ResumeService as ResumePublicationService

    Admin->>AiController: GET /ai/reports/runtime
    AiController->>AiService: getProviderSummary()
    AiService->>Provider: getSummary()
    Provider-->>AiService: provider/model summary
    AiController-->>Admin: runtime summary

    Admin->>RoleGuard: POST /ai/reports/analyze
    RoleGuard-->>AiController: canTriggerAiAnalysis
    AiController->>AiService: generateText(systemPrompt, prompt)
    AiService->>Provider: generateText(...)
    Provider-->>AiService: generated text
    AiController->>Cache: storeGeneratedReport(...)
    Cache-->>AiController: structured report
    AiController-->>Admin: report result

    Admin->>RoleGuard: POST /ai/reports/resume-optimize
    RoleGuard-->>AiController: canTriggerAiAnalysis
    AiController->>Optimize: generateSuggestion(body)
    Optimize->>ResumeService: getDraft()
    Optimize->>AiService: generateText(...)
    AiService->>Provider: generateText(...)
    Provider-->>AiService: JSON patch / mock suggestion
    Optimize-->>AiController: suggestion + diff + applyPayload
    AiController-->>Admin: optimization result

    Admin->>RoleGuard: POST /ai/reports/resume-optimize/apply
    RoleGuard-->>AiController: canEditResume
    AiController->>Optimize: applySuggestion(body)
    Optimize->>ResumeService: updateDraft(nextResume)
    Optimize-->>AiController: applied draft
    AiController-->>Admin: 200 OK
```

对应源码：

- `apps/server/src/modules/ai/ai.module.ts`
- `apps/server/src/modules/ai/ai-report.controller.ts`
- `apps/server/src/modules/ai/ai.service.ts`
- `apps/server/src/modules/ai/config/ai-config.ts`
- `apps/server/src/modules/ai/providers/`
- `apps/server/src/modules/ai/ai-resume-optimization.service.ts`

## 4. RAG 建索引、检索与问答

```mermaid
sequenceDiagram
    participant Admin as admin / 调试方
    participant RagController as RagController
    participant RoleGuard as RoleCapabilitiesGuard
    participant RagService as RagService
    participant Chunk as RagChunkService
    participant Knowledge as RagKnowledgeService
    participant AiService as AiService
    participant Provider as Embedding/Chat Provider
    participant Repo as RagIndexRepository
    participant Files as YAML + blog/*.md + resume-index.json

    Admin->>RagController: POST /ai/rag/index/rebuild
    RagController->>RoleGuard: canTriggerAiAnalysis
    RagController->>RagService: rebuildIndex()
    RagService->>Files: read resume.zh.yaml
    RagService->>Chunk: parseSource + buildChunks
    RagService->>Files: read blog/*.md
    RagService->>Knowledge: buildArticleChunksFromDirectory
    RagService->>AiService: embedTexts(all chunks)
    AiService->>Provider: embeddings request
    Provider-->>AiService: embeddings
    RagService->>Repo: writeIndex(index json)
    Repo->>Files: write storage/rag/resume-index.json
    RagService-->>RagController: status
    RagController-->>Admin: rebuild result

    Admin->>RagController: POST /ai/rag/search
    RagController->>RagService: search(query)
    RagService->>Repo: readIndex()
    RagService->>AiService: embedTexts([query])
    AiService->>Provider: embeddings request
    Provider-->>AiService: query vector
    RagService->>RagService: cosine + keyword score 排序
    RagService-->>RagController: top matches
    RagController-->>Admin: matches

    Admin->>RagController: POST /ai/rag/ask
    RagController->>RagService: ask(question)
    RagService->>RagService: search(question)
    RagService->>AiService: generateText(contextual prompt)
    AiService->>Provider: chat completion
    Provider-->>AiService: grounded answer
    RagService-->>RagController: answer + matches
    RagController-->>Admin: final response
```

对应源码：

- `apps/server/src/modules/ai/rag/rag.controller.ts`
- `apps/server/src/modules/ai/rag/rag.service.ts`
- `apps/server/src/modules/ai/rag/rag-chunk.service.ts`
- `apps/server/src/modules/ai/rag/rag-knowledge.service.ts`
- `apps/server/src/modules/ai/rag/rag-index.repository.ts`

## 推荐阅读顺序

如果你下次再看 `server`，建议按这个顺序：

1. `apps/server/src/main.ts`
2. `apps/server/src/app.module.ts`
3. `apps/server/src/modules/auth/`
4. `apps/server/src/modules/resume/`
5. `apps/server/src/modules/ai/ai.module.ts`
6. `apps/server/src/modules/ai/ai-report.controller.ts`
7. `apps/server/src/modules/ai/rag/rag.service.ts`

这样更容易先建立“请求怎么进来、权限怎么卡住、数据怎么落库、AI 怎么接进来”的整体感，再去看具体实现细节。

## 5. 发布后为什么 web 刷新就能看到新数据

这一段只看 `resume` 主链路，不引入 AI 模块。

### 5.1 发布到刷新时序（最小闭环）

```mermaid
sequenceDiagram
    participant Admin as admin 发布页
    participant ApiClient as @my-resume/api-client
    participant ResumeController as server /resume
    participant ResumeService as ResumePublicationService
    participant ResumeRepo as ResumePublicationRepository
    participant DB as SQLite
    participant WebPage as web SSR 页面

    Admin->>ApiClient: publishResume()
    ApiClient->>ResumeController: POST /resume/publish
    ResumeController->>ResumeService: publish()
    ResumeService->>ResumeService: getDraft()
    ResumeService->>ResumeRepo: createPublishedSnapshot(draft)
    ResumeRepo->>DB: insert resume_publication_snapshots
    DB-->>ResumeRepo: 新发布快照
    ResumeRepo-->>ResumeService: snapshot
    ResumeService-->>ResumeController: published snapshot
    ResumeController-->>Admin: 发布成功

    WebPage->>ApiClient: fetchPublishedResume()
    ApiClient->>ResumeController: GET /resume/published (no-store)
    ResumeController->>ResumeService: getPublished()
    ResumeService->>ResumeRepo: findLatestPublishedSnapshot()
    ResumeRepo->>DB: order by published_at desc limit 1
    DB-->>WebPage: 返回最新发布快照
```

### 5.2 数据状态图（为什么不是“改一个状态位”）

```mermaid
stateDiagram-v2
    [*] --> Draft: 初始化或编辑
    Draft --> Draft: PUT /resume/draft
    Draft --> PublishedSnapshot: POST /resume/publish
    PublishedSnapshot --> PublishedSnapshot: 再次发布(新增一条快照)

    note right of Draft
      存储位置: resume_drafts
      只有一条标准简历草稿位
    end note

    note right of PublishedSnapshot
      存储位置: resume_publication_snapshots
      每次发布追加新记录
      web 读取最后一条
    end note
```

### 5.3 关键结论（你排查同步问题时先看这里）

- 没有使用 WebSocket 推送；是“发布成功 + 页面刷新触发重新请求”。
- `web` 读取公开简历走 `fetch(..., { cache: 'no-store' })`，刷新会重新拉接口。
- `server` 发布语义是“从 draft 生成新 snapshot”，`web` 永远读取最新 snapshot。
- 如果你看到“发布后没变”，优先排查：
  - `web` 实际请求的 `API_BASE_URL` 是否指向同一 `server`
  - 是否真的走了 `/resume/publish` 并成功返回
  - DB 中 `resume_publication_snapshots` 是否新增了记录
