import { MetricType } from '@zilliz/milvus2-sdk-node';
import { getEmbedding, validateEmbedding } from '../embedding-client.mjs';
import { buildPrompt, getTemplateByStrategy } from './prompt-builder.mjs';
import { retrieve } from './retriever.mjs';

function getCollectionVectorDim(detail) {
  const dim = detail?.schema?.fields?.find((field) => field.name === 'vector')?.dim;
  return Number(dim || 0);
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

export function detectQuestionStrategy(question) {
  const normalized = normalizeText(question);

  if (/经验|经历|做过|负责过|项目|实战|案例|落地|主导|参与|开发相关经验/.test(normalized)) {
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
  // 把片段的所有文本字段拼成一个大字符串，一次性做匹配
  const haystack = [
    item.section,
    item.subsection_key,
    item.subsection_title,
    item.entity_type,
    item.content,
    // tags 是数组，需要展开后才能参与匹配
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
      // 线性累加，命中越多加分越多
      boost += 0.015;
    }
  }

  return {
    matchedHintCount,
    // 关键词加分上限 0.09，防止关键词堆砌的片段无限刷分
    boost: Math.min(boost, 0.09),
  };
}

export function rerankMatches(matches, question, strategy) {
  const keywordHints = getKeywordHints(question);

  return matches
    .map((item, index) => {
      const baseScore = Number(item.score || 0);
      const sectionBoost = scoreSectionBoost(item, strategy);
      const { boost: keywordBoost, matchedHintCount } = scoreKeywordBoost(item, keywordHints);
      const rerankScore = baseScore + sectionBoost + keywordBoost;

      // 注： _ 前缀字段是调试元数据，不影响业务逻辑，但在日志里极其有用
      return {
        ...item,
        _rawIndex: index, // 原始排名，便于对比
        _baseScore: baseScore,
        _sectionBoost: sectionBoost,
        _keywordBoost: keywordBoost,
        _matchedHintCount: matchedHintCount,
        _rerankScore: rerankScore,
      };
    })
    // 按重排分降序，最相关的片段排最前
    .sort((a, b) => b._rerankScore - a._rerankScore);
}

// 把每个片段格式化成结构化文本块，让 LLM 能清楚区分每个片段的来源
export function formatContext(matches) {
  return matches
    .map(
      (item, index) => `[片段 ${index + 1}]
section: ${item.section}
subsectionKey: ${item.subsection_key}
subsectionTitle: ${item.subsection_title}
entityType: ${item.entity_type}
rawScore: ${Number(item._baseScore ?? item.score ?? 0).toFixed(4)}
rerankScore: ${Number(item._rerankScore ?? item.score ?? 0).toFixed(4)}
content: ${item.content}`
    )
    .join('\n\n-----\n\n');
}

export async function runRAG({
  client,
  model,
  collectionName,
  question,
  history = [],
  topK = 8,
  candidateTopK = Math.max(topK * 2, 10),
  filter = '',
  metricType = MetricType.COSINE,
  outputFields, // 不设默认值，由 retriever.mjs 内部的默认值接管，职责边界清晰
  strategy = '',
  promptTemplate = '',
  enableRerank = true, // 新增：可关闭重排，可以用于 A/B 测试对比有无重排的效果
}) {
  const resolvedStrategy = strategy || detectQuestionStrategy(question);
  const resolvedTemplate = getTemplateByStrategy(resolvedStrategy, promptTemplate);

  const collectionDetail = await client.describeCollection({
    collection_name: collectionName,
  });

  // 先查维度，再生成向量 — 避免白白调用 embedding API 后才发现维度不匹配
  const collectionVectorDim = getCollectionVectorDim(collectionDetail);
  const queryVector = await getEmbedding(question);
  const { nonZeroCount } = validateEmbedding(queryVector, 'query embedding');

  if (queryVector.length !== collectionVectorDim) {
    throw new Error(
      `查询向量维度与集合不一致：集合为 ${collectionVectorDim}，当前 embedding 为 ${queryVector.length}`
    );
  }

  // 第一阶段：多召回候选
  const rawMatches = await retrieve(client, queryVector, {
    collectionName,
    topK: candidateTopK,
    metricType,
    filter,
    outputFields,
  });

  // 第二阶段：重排 or 透传
  const rerankedMatches = enableRerank
    ? rerankMatches(rawMatches, question, resolvedStrategy)
    : rawMatches.map((item) => ({
        ...item,
        _baseScore: Number(item.score || 0),
        _sectionBoost: 0,
        _keywordBoost: 0,
        _matchedHintCount: 0,
        _rerankScore: Number(item.score || 0),
      }));

  // 截取最终片段
  const finalMatches = rerankedMatches.slice(0, topK);
  const context = formatContext(finalMatches);
  const prompt = buildPrompt(resolvedTemplate, {
    context,
    question,
    history,
  });

  const response = await model.invoke(prompt);

  return {
    question,
    strategy: resolvedStrategy,
    promptTemplate: resolvedTemplate,
    candidateTopK,
    topK,
    filter,
    queryVectorDim: queryVector.length,
    queryNonZeroCount: nonZeroCount,
    rawMatches,
    rerankedMatches,
    finalMatches,
    context,
    prompt,
    answer: response.content,
  };
}
