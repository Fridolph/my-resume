import type {
  AiWorkbenchScenario,
  AiResumeOptimizationChangedModule,
  AiResumeOptimizationResult,
} from '../types/ai-workbench.types'

export const RESUME_OPTIMIZATION_CONTENT_STORAGE_KEY =
  'admin:ai:resume-optimization:content:v1'
export const RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY =
  'admin:ai:resume-optimization:history:v1'
export const AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY =
  'admin:ai:workbench:relation-index:v1'

export interface ResumeOptimizationHistoryEntry {
  changedModules: AiResumeOptimizationChangedModule[]
  createdAt: string
  instruction: string
  instructionHash: string
  locale: 'zh' | 'en'
  resultId: string
  summary: string
  usageRecordId?: string
}

export interface AiWorkbenchRelationIndexEntry {
  analysisUsageRecordIds: Partial<Record<AiWorkbenchScenario, string>>
  instructionHash: string
  resumeOptimizationUsageRecordId?: string
  updatedAt: string
}

export const DEFAULT_RESUME_OPTIMIZATION_TEMPLATE = `# JS 高级全栈工程师 JD

---

> 📍 工作地点：[城市]｜💼 工作性质：全职｜🏢 部门：技术研发中心

---

## 职位名称

**高级全栈工程师（JavaScript方向）**

---

## 职位概述

我们正在寻找一位经验丰富的高级全栈工程师，加入我们快速成长的技术团队。你将深度参与公司核心产品的架构设计与研发工作，在前后端技术栈上均能独当一面，并具备良好的技术领导力与跨团队协作能力。

---

## 岗位职责

- 🔹 **架构设计**：负责前后端系统的整体架构设计，制定技术规范与最佳实践
- 🔹 **前端开发**：基于 **React / Vue** 等主流框架开发高性能、可维护的 Web 应用
- 🔹 **后端开发**：使用 **Node.js（Express / NestJS / Koa）** 构建稳定、高并发的服务端应用
- 🔹 **接口设计**：设计并开发 RESTful API 或 GraphQL 接口，保障接口的安全性与可扩展性
- 🔹 **数据库管理**：熟练操作 MySQL / PostgreSQL / MongoDB / Redis 等数据库，进行性能调优
- 🔹 **DevOps 实践**：参与 CI/CD 流程建设，熟悉 Docker / Kubernetes / 云服务（AWS / 阿里云）部署
- 🔹 **代码质量**：主导 Code Review，推动单元测试、集成测试覆盖率提升
- 🔹 **技术攻关**：解决系统性能瓶颈、安全漏洞等复杂技术问题
- 🔹 **团队赋能**：指导初中级工程师成长，参与技术分享与知识沉淀

---

## 任职要求

### 🎓 基本条件
- 本科及以上学历，计算机科学、软件工程或相关专业
- **5年以上**全栈开发经验，其中 **3年以上** Node.js 后端开发经验

### 💻 技术能力

| 技术方向 | 要求掌握内容 |
|---|---|
| **JavaScript / TypeScript** | 深入理解 ES6+、异步编程、设计模式、TS 类型系统 |
| **前端框架** | 精通 React 或 Vue（含状态管理 Redux / Pinia / Zustand）|
| **Node.js** | 熟练使用 Express / NestJS / Koa，理解事件循环与性能优化 |
| **数据库** | 熟练使用关系型 + 非关系型数据库，具备索引优化能力 |
| **工程化** | 熟悉 Webpack / Vite / Rollup，了解微前端架构 |
| **云服务 & 容器** | 有 Docker / K8s 实际使用经验，了解 Serverless |
| **测试** | 熟悉 Jest / Vitest / Cypress 等测试框架 |
| **版本管理** | 熟练使用 Git，了解 GitFlow 工作流 |

### ➕ 加分项
- 有 **微服务架构**设计与落地经验
- 熟悉 **WebSocket / SSE** 等实时通信技术
- 了解 **Web 安全**（XSS、CSRF、SQL注入等）防护机制
- 有开源项目贡献或技术博客
- 有大厂或独角兽公司工作经历

---

## 我们提供

- 💰 **薪资**：25K - 45K（根据能力面议）+ 年终奖
- 📈 **期权**：核心岗位提供公司期权激励
- 🏖️ **假期**：15天带薪年假 + 法定节假日
- 🎓 **成长**：技术大会报销 / 书籍订阅 / 内部技术分享
- 🏥 **福利**：六险一金 + 补充医疗保险
- 🍱 **其他**：弹性工作制 / 免费三餐 / 健身房

---

> 📮 **简历投递**：hr@company.com
> 📞 **联系电话**：+86 xxx-xxxx-xxxx
> 🌐 **官网**：www.company.com

---

*我们期待有想法、有热情、有技术深度的你加入！*`

export function readResumeOptimizationContent(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_RESUME_OPTIMIZATION_TEMPLATE
  }

  const storedContent = window.localStorage.getItem(
    RESUME_OPTIMIZATION_CONTENT_STORAGE_KEY,
  )

  return storedContent?.trim()
    ? storedContent
    : DEFAULT_RESUME_OPTIMIZATION_TEMPLATE
}

export function writeResumeOptimizationContent(content: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(RESUME_OPTIMIZATION_CONTENT_STORAGE_KEY, content)
}

export function normalizeOptimizationInstruction(content: string): string {
  return content
    .replaceAll('\r\n', '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extractOptimizationInstructionTitle(content: string): string {
  const normalizedContent = normalizeOptimizationInstruction(content)

  if (!normalizedContent) {
    return '未命名优化指令'
  }

  const lines = normalizedContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const markdownHeading = lines.find((line) => /^#\s+/.test(line))
  const candidateTitle = markdownHeading
    ? markdownHeading.replace(/^#\s+/, '')
    : lines[0]

  return candidateTitle?.trim() || '未命名优化指令'
}

export function createInstructionHash(content: string): string {
  const normalizedContent = normalizeOptimizationInstruction(content)
  let hashValue = 5381

  for (const character of normalizedContent) {
    hashValue = (hashValue * 33) ^ character.charCodeAt(0)
  }

  const normalizedHash = (hashValue >>> 0).toString(36)

  return `${normalizedHash}-${normalizedContent.length.toString(36)}`
}

function normalizeHistoryEntry(
  entry: Partial<ResumeOptimizationHistoryEntry> | null | undefined,
): ResumeOptimizationHistoryEntry | null {
  if (
    !entry ||
    typeof entry.createdAt !== 'string' ||
    typeof entry.instruction !== 'string' ||
    typeof entry.locale !== 'string' ||
    typeof entry.resultId !== 'string' ||
    typeof entry.summary !== 'string'
  ) {
    return null
  }

  const instruction = entry.instruction
  const instructionHash =
    typeof entry.instructionHash === 'string' && entry.instructionHash.trim()
      ? entry.instructionHash
      : createInstructionHash(instruction)

  return {
    changedModules: Array.isArray(entry.changedModules)
      ? entry.changedModules.filter(Boolean) as AiResumeOptimizationChangedModule[]
      : [],
    createdAt: entry.createdAt,
    instruction,
    instructionHash,
    locale: entry.locale === 'en' ? 'en' : 'zh',
    resultId: entry.resultId,
    summary: entry.summary,
    usageRecordId:
      typeof entry.usageRecordId === 'string' && entry.usageRecordId.trim()
        ? entry.usageRecordId
        : undefined,
  }
}

export function readResumeOptimizationHistory(): ResumeOptimizationHistoryEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawValue = window.localStorage.getItem(RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Array<Partial<ResumeOptimizationHistoryEntry>>

    return Array.isArray(parsedValue)
      ? parsedValue
          .map((item) => normalizeHistoryEntry(item))
          .filter((item): item is ResumeOptimizationHistoryEntry => Boolean(item))
      : []
  } catch {
    return []
  }
}

function normalizeRelationIndexEntry(
  instructionHash: string,
  entry: Partial<AiWorkbenchRelationIndexEntry> | null | undefined,
): AiWorkbenchRelationIndexEntry | null {
  if (!instructionHash.trim()) {
    return null
  }

  const rawAnalysisUsageRecordIds =
    entry?.analysisUsageRecordIds && typeof entry.analysisUsageRecordIds === 'object'
      ? entry.analysisUsageRecordIds
      : {}

  const analysisUsageRecordIds = Object.fromEntries(
    Object.entries(rawAnalysisUsageRecordIds).filter(
      ([scenario, usageRecordId]) =>
        ['jd-match', 'resume-review', 'offer-compare'].includes(scenario) &&
        typeof usageRecordId === 'string' &&
        usageRecordId.trim(),
    ),
  ) as Partial<Record<AiWorkbenchScenario, string>>

  return {
    analysisUsageRecordIds,
    instructionHash,
    resumeOptimizationUsageRecordId:
      typeof entry?.resumeOptimizationUsageRecordId === 'string' &&
      entry.resumeOptimizationUsageRecordId.trim()
        ? entry.resumeOptimizationUsageRecordId
        : undefined,
    updatedAt:
      typeof entry?.updatedAt === 'string' && entry.updatedAt.trim()
        ? entry.updatedAt
        : new Date().toISOString(),
  }
}

export function readWorkbenchRelationIndex(): Record<string, AiWorkbenchRelationIndexEntry> {
  if (typeof window === 'undefined') {
    return {}
  }

  const rawValue = window.localStorage.getItem(AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Record<
      string,
      Partial<AiWorkbenchRelationIndexEntry>
    >

    if (!parsedValue || typeof parsedValue !== 'object') {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsedValue)
        .map(([instructionHash, entry]) => [
          instructionHash,
          normalizeRelationIndexEntry(instructionHash, entry),
        ])
        .filter((entry): entry is [string, AiWorkbenchRelationIndexEntry] => Boolean(entry[1])),
    )
  } catch {
    return {}
  }
}

function writeWorkbenchRelationIndex(index: Record<string, AiWorkbenchRelationIndexEntry>) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY,
    JSON.stringify(index),
  )
}

export function appendAnalysisUsageRelation(input: {
  content: string
  scenario: AiWorkbenchScenario
  usageRecordId?: string
}) {
  if (typeof window === 'undefined' || !input.usageRecordId) {
    return
  }

  const instructionHash = createInstructionHash(input.content)
  const currentIndex = readWorkbenchRelationIndex()
  const currentEntry =
    currentIndex[instructionHash] ??
    normalizeRelationIndexEntry(instructionHash, {
      instructionHash,
    })

  if (!currentEntry) {
    return
  }

  writeWorkbenchRelationIndex({
    ...currentIndex,
    [instructionHash]: {
      ...currentEntry,
      analysisUsageRecordIds: {
        ...currentEntry.analysisUsageRecordIds,
        [input.scenario]: input.usageRecordId,
      },
      updatedAt: new Date().toISOString(),
    },
  })
}

export function upsertResumeOptimizationHistoryEntry(
  result: AiResumeOptimizationResult,
  instruction: string,
) {
  if (typeof window === 'undefined') {
    return
  }

  const normalizedInstruction = normalizeOptimizationInstruction(instruction)
  const instructionHash = createInstructionHash(normalizedInstruction)

  const nextEntry: ResumeOptimizationHistoryEntry = {
    changedModules: result.changedModules,
    createdAt: result.createdAt,
    instruction: normalizedInstruction,
    instructionHash,
    locale: result.locale,
    resultId: result.resultId,
    summary: result.summary,
    usageRecordId: result.usageRecordId,
  }

  const nextHistory = [
    nextEntry,
    ...readResumeOptimizationHistory().filter((item) => item.resultId !== result.resultId),
  ].slice(0, 8)

  window.localStorage.setItem(
    RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY,
    JSON.stringify(nextHistory),
  )

  const currentIndex = readWorkbenchRelationIndex()
  const currentEntry =
    currentIndex[instructionHash] ??
    normalizeRelationIndexEntry(instructionHash, {
      instructionHash,
    })

  if (!currentEntry) {
    return
  }

  writeWorkbenchRelationIndex({
    ...currentIndex,
    [instructionHash]: {
      ...currentEntry,
      resumeOptimizationUsageRecordId:
        result.usageRecordId ?? currentEntry.resumeOptimizationUsageRecordId,
      updatedAt: result.createdAt,
    },
  })
}
