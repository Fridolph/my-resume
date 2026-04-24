// 这个脚本是在 ask-resume.mjs 基础上的“效果优化实验版”。
//
// 目标不是改掉原始 demo，而是额外保留一份更适合继续做检索质量实验的脚本。
//
// 当前这版先做三件事：
// 1. 先扩大 Milvus 候选召回范围，避免有价值的项目片段被挡在 topK 外
// 2. 根据“问题类型”做简单重排（尤其是经验类问题，优先 projects / work_experience）
// 3. 在 prompt 里显式要求模型优先使用“项目 / 实战经历”回答
import 'dotenv/config';
import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node';
import { ChatOpenAI } from '@langchain/openai';
import { getEmbedding, validateEmbedding } from './embedding-client.mjs';

const COLLECTION_NAME = process.env.RESUME_RAG_COLLECTION || 'resume_profile_chunks';
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';
const FINAL_TOP_K = Number(process.env.RESUME_RAG_TOP_K || 8);
const CANDIDATE_TOP_K = Number(process.env.RESUME_RAG_CANDIDATE_TOP_K || Math.max(FINAL_TOP_K * 2, 10));

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.2,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const client = new MilvusClient({
  address: MILVUS_ADDRESS,
});

function getCollectionVectorDim(detail) {
  const dim = detail?.schema?.fields?.find((field) => field.name === 'vector')?.dim;
  return Number(dim || 0);
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function detectQuestionStrategy(question) {
  const normalized = normalizeText(question);

  // 经验类问题通常希望看到“做过什么项目 / 有哪些实战经验”，
  // 这种问题不应该让 skill_item 永远排在最前面。
  if (
    /经验|经历|做过|负责过|项目|实战|案例|落地|主导|参与|开发相关经验/.test(normalized)
  ) {
    return 'experience';
  }

  if (/技能|擅长|会什么|技术栈|掌握|熟悉/.test(normalized)) {
    return 'skill';
  }

  if (/项目|作品|案例/.test(normalized)) {
    return 'project';
  }

  return 'general';
}

function getKeywordHints(question) {
  const normalized = normalizeText(question);
  const hints = new Set();

  if (normalized.includes('ai')) {
    ['ai', 'agent', 'prompt', 'sse', '流式', '工作流', '多 agent', '多智能体', 'ai 工作台', 'ai 分析'].forEach(
      (item) => hints.add(item)
    );
  }

  if (normalized.includes('agent')) {
    ['agent', '多 agent', '多智能体', '工作流', '规划', '执行', '验证', '反馈'].forEach((item) => hints.add(item));
  }

  if (normalized.includes('my-resume') || normalized.includes('简历')) {
    ['my-resume', '简历', 'ai 工作台', 'markdown', 'pdf', 'monorepo'].forEach((item) => hints.add(item));
  }

  if (/sse|流式/.test(normalized)) {
    ['sse', '流式', '会话管理', '上下文'].forEach((item) => hints.add(item));
  }

  return [...hints];
}

function scoreSectionBoost(item, strategy) {
  const section = item.section;
  const entityType = item.entity_type || item.entityType || '';

  if (strategy === 'experience') {
    if (section === 'projects') return entityType.includes('summary') ? 0.12 : 0.1;
    if (section === 'work_experience') return entityType.includes('summary') ? 0.1 : 0.08;
    if (section === 'core_strengths') return 0.02;
    if (section === 'skills') return -0.02;
  }

  if (strategy === 'project') {
    if (section === 'projects') return entityType.includes('summary') ? 0.14 : 0.1;
    if (section === 'work_experience') return 0.04;
    if (section === 'skills') return -0.03;
  }

  if (strategy === 'skill') {
    if (section === 'skills') return 0.1;
    if (section === 'core_strengths') return 0.05;
    if (section === 'projects') return 0.01;
    if (section === 'work_experience') return 0.01;
  }

  return 0;
}

function scoreKeywordBoost(item, keywordHints) {
  const haystack = [
    item.section,
    item.subsection_key,
    item.subsection_title,
    item.entity_type,
    item.content,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ]
    .map((part) => normalizeText(part))
    .join('\n');

  let boost = 0;
  let matchedHintCount = 0;

  for (const keyword of keywordHints) {
    if (!keyword) continue;
    if (haystack.includes(normalizeText(keyword))) {
      matchedHintCount += 1;
      boost += 0.015;
    }
  }

  // 做个上限，避免某条数据因为文字堆得多就被无限抬高。
  return {
    matchedHintCount,
    boost: Math.min(boost, 0.09),
  };
}

function rerankMatches(matches, question, strategy) {
  const keywordHints = getKeywordHints(question);

  return matches
    .map((item, index) => {
      const baseScore = Number(item.score || 0);
      const sectionBoost = scoreSectionBoost(item, strategy);
      const { boost: keywordBoost, matchedHintCount } = scoreKeywordBoost(item, keywordHints);

      // 这里先用“原始相似度 + 业务偏置分”做一个学习版重排。
      // 后续如果要继续升级，可以再引入：
      // - bm25 / keyword 搜索
      // - cross-encoder rerank
      // - 手工规则更细的 query rewrite
      const rerankScore = baseScore + sectionBoost + keywordBoost;

      return {
        ...item,
        _rawIndex: index,
        _baseScore: baseScore,
        _sectionBoost: sectionBoost,
        _keywordBoost: keywordBoost,
        _matchedHintCount: matchedHintCount,
        _rerankScore: rerankScore,
      };
    })
    .sort((a, b) => b._rerankScore - a._rerankScore);
}

function buildPrompt({ question, strategy, context }) {
  const strategyInstruction =
    strategy === 'experience'
      ? `你现在处理的是“经验/经历类”问题。
回答时请遵守以下优先级：
1. 优先引用 projects 和 work_experience；
2. 如果 skills 或 core_strengths 能补充背景，可以补充，但不能喧宾夺主；
3. 如果项目或工作经历中证据不足，再明确说明不足。`
      : strategy === 'project'
        ? `你现在处理的是“项目类”问题。
回答时优先引用 projects，其次才是 work_experience。`
        : strategy === 'skill'
          ? `你现在处理的是“技能类”问题。
回答时优先引用 skills 和 core_strengths，如有项目能佐证再补充。`
          : `你现在处理的是“通用总结类”问题。
请根据证据强弱组织回答。`;

  return `你是一个简历问答助手。请只基于给定的简历片段回答问题，不要脑补。

${strategyInstruction}

如果片段证据不足：
1. 请明确说“当前检索到的简历片段不足以确认这个问题”；
2. 但如果已有部分相关证据，也可以给出“有限结论 + 不足说明”；
3. 回答时尽量指出信息来自哪些 section。

## 限制

- 简历外的信息，技术博客，AI学习，易经学习，个人生活，兴趣爱好相关可，但禁止回答用户隐私和其他无关提问；
- 禁止回答违反法律，社会价值道德观等问题，并警告提问者会进行后台记录。

简历片段：
${context}

问题：${question}

回答要求：
1. 先给结论；
2. 经验类问题优先总结项目/工作经历，再补充技能；
3. 不要只是罗列，要尽量归纳出“最能代表候选人的经历”；
4. 如果项目证据存在但不充分，要直说“目前更像是部分佐证，而非完整结论”。

回答：`;
}

async function main() {
  const question =
    process.argv
      .slice(2)
      .filter((item) => item !== '--')
      .join(' ')
      .trim() || '这个候选人有哪些 AI Agent 开发相关经验？';

  const strategy = detectQuestionStrategy(question);

  console.log(`Connecting to Milvus at ${MILVUS_ADDRESS}...`);
  await client.connectPromise;
  console.log('Connected.\n');

  const collectionDetail = await client.describeCollection({
    collection_name: COLLECTION_NAME,
  });
  const collectionVectorDim = getCollectionVectorDim(collectionDetail);
  const queryVector = await getEmbedding(question);
  const { nonZeroCount } = validateEmbedding(queryVector, 'query embedding');

  console.log(`Question strategy: ${strategy}`);
  console.log(`Candidate topK: ${CANDIDATE_TOP_K}`);
  console.log(`Final topK: ${FINAL_TOP_K}`);
  console.log(`Query embedding check: dim=${queryVector.length}, nonZero=${nonZeroCount}/${queryVector.length}\n`);

  if (queryVector.length !== collectionVectorDim) {
    throw new Error(
      `查询向量维度与集合不一致：集合为 ${collectionVectorDim}，当前 embedding 为 ${queryVector.length}`
    );
  }

  const searchResult = await client.search({
    collection_name: COLLECTION_NAME,
    vector: queryVector,
    limit: CANDIDATE_TOP_K,
    metric_type: MetricType.COSINE,
    output_fields: [
      'source_id',
      'locale',
      'section',
      'subsection_key',
      'subsection_title',
      'entity_type',
      'content',
      'tags',
      'chunk_index',
      'chunk_count',
    ],
  });

  const matches = searchResult.results || [];
  const rerankedMatches = rerankMatches(matches, question, strategy);
  const finalMatches = rerankedMatches.slice(0, FINAL_TOP_K);

  console.log(`Question: ${question}\n`);

  console.log('Raw candidates:\n');
  matches.forEach((item, index) => {
    console.log(
      `${index + 1}. [${Number(item.score).toFixed(4)}] ${item.section} / ${item.subsection_title} / ${item.entity_type}`
    );
    console.log(`   subsectionKey: ${item.subsection_key}`);
    console.log(`   tags: ${Array.isArray(item.tags) ? item.tags.join(', ') : ''}`);
    console.log(`   content: ${String(item.content).slice(0, 180)}\n`);
  });

  console.log('Reranked candidates:\n');
  finalMatches.forEach((item, index) => {
    console.log(
      `${index + 1}. [raw=${item._baseScore.toFixed(4)} | rerank=${item._rerankScore.toFixed(4)}] ${item.section} / ${item.subsection_title} / ${item.entity_type}`
    );
    console.log(
      `   boosts: section=${item._sectionBoost.toFixed(3)}, keyword=${item._keywordBoost.toFixed(3)}, hints=${item._matchedHintCount}`
    );
    console.log(`   subsectionKey: ${item.subsection_key}`);
    console.log(`   tags: ${Array.isArray(item.tags) ? item.tags.join(', ') : ''}`);
    console.log(`   content: ${String(item.content).slice(0, 180)}\n`);
  });

  const context = finalMatches
    .map(
      (item, index) => `[片段 ${index + 1}]
section: ${item.section}
subsectionKey: ${item.subsection_key}
subsectionTitle: ${item.subsection_title}
entityType: ${item.entity_type}
rawScore: ${item._baseScore.toFixed(4)}
rerankScore: ${item._rerankScore.toFixed(4)}
content: ${item.content}`
    )
    .join('\n\n-----\n\n');

  const prompt = buildPrompt({
    question,
    strategy,
    context,
  });

  const response = await model.invoke(prompt);
  console.log('Answer:\n');
  console.log(response.content);
}

main().catch((error) => {
  console.error('ask-2 failed:', error);
  process.exit(1);
});
