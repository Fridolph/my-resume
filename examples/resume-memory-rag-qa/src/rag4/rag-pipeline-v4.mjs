import { MetricType } from '@zilliz/milvus2-sdk-node';
import { getEmbedding, validateEmbedding } from '../embedding-client.mjs';
import { retrieve } from '../rag/retriever.mjs';
import {
  detectQuestionStrategy,
  formatContext,
  rerankMatches,
} from '../rag/rag-pipeline.mjs';
import { buildPrompt, formatHistory, getTemplateByStrategy } from './prompt-loader.mjs';

function getCollectionVectorDim(detail) {
  // 从 collection schema 中读取向量维度，
  // 防止“查询端 embedding dim”和“库存 dim”不一致。
  const dim = detail?.schema?.fields?.find((field) => field.name === 'vector')?.dim;
  return Number(dim || 0);
}

function normalizeText(value) {
  // 所有关键词判断前都先做统一小写化。
  return String(value || '').toLowerCase();
}

function extractQuestionKeywords(question) {
  // 这里提取的是“问题里的主题词”。
  //
  // 作用不是替代向量检索，
  // 而是在去噪阶段给我们一个更具业务解释性的信号：
  // 当前候选片段到底有没有触到这些主题。
  const normalized = normalizeText(question);
  const keywords = new Set();

  if (normalized.includes('ai')) keywords.add('ai');
  if (normalized.includes('agent')) keywords.add('agent');
  if (normalized.includes('sse') || normalized.includes('流式')) keywords.add('sse');
  if (normalized.includes('工作流')) keywords.add('工作流');
  if (normalized.includes('my-resume')) keywords.add('my-resume');

  return [...keywords];
}

function preferredSectionsForStrategy(strategy) {
  // 不同问题类型，对应不同 section 优先级。
  //
  // 例如：
  // - 经验类问题更偏 projects / work_experience
  // - 技能类问题更偏 skills / core_strengths
  //
  // 这不是“真理”，而是当前简历问答 demo 的业务假设。
  if (strategy === 'experience') return ['projects', 'work_experience', 'core_strengths'];
  if (strategy === 'project') return ['projects', 'work_experience'];
  if (strategy === 'skill') return ['skills', 'core_strengths', 'projects'];
  return ['projects', 'work_experience', 'skills', 'core_strengths', 'profile'];
}

function detectNoiseReasons(item, leader, strategy, questionKeywords) {
  // 这个函数不直接决定“留还是删”，
  // 而是先为每条记录打上“可能是噪音的原因”。
  //
  // 为什么先记录 reasons，而不是直接 if/else 删掉？
  // 因为学习阶段最重要的是“可解释性”：
  // 你不仅要知道某条被丢了，还要知道它为什么被判成噪音。
  const reasons = [];
  const preferredSections = preferredSectionsForStrategy(strategy);
  const isPreferredSection = preferredSections.includes(item.section);
  const hasHints = Number(item._matchedHintCount || 0) > 0;
  // rerankGap：与头部第一名结果的分差。
  // 这个值越大，说明当前条目越可能只是“沾边召回”。
  const rerankGap = Number(leader?._rerankScore || 0) - Number(item._rerankScore || 0);
  const rawScore = Number(item._baseScore || item.score || 0);
  const rerankScore = Number(item._rerankScore || item.score || 0);
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

  const topicHit = questionKeywords.some((keyword) => haystack.includes(keyword));

  if (!isPreferredSection) {
    // 不是当前问题最关心的业务区域。
    reasons.push('非当前问题优先 section');
  }

  if (!hasHints && questionKeywords.length > 0) {
    // 这条记录没命中我们在问题里提取出的主题提示词。
    reasons.push('未命中主题 hint');
  }

  if (!topicHit && questionKeywords.length > 0) {
    // 从文本表面看，也缺少与问题主题的直接关联。
    reasons.push('与问题主题缺少直接文本关联');
  }

  if (rerankGap > 0.14) {
    // 注意：这不是一个全局绝对阈值，
    // 而是当前 demo 中“与第一名差得太远”的经验规则。
    reasons.push('与头部结果分差过大');
  }

  if (rawScore < 0.48) {
    // 这里同样只是当前数据集下的经验阈值，不是通用真理。
    reasons.push('原始向量分偏低');
  }

  if (rerankScore < 0.6) {
    reasons.push('重排后分数偏低');
  }

  if ((strategy === 'experience' || strategy === 'project') && !hasHints && item.section !== 'core_strengths') {
    // 对经验类问题，主题证据尤其重要。
    reasons.push('经验类问题下缺少主题证据');
  }

  return [...new Set(reasons)];
}

export function denoiseMatches(matches, question, strategy, options = {}) {
  // 去噪阶段的目标不是“追求绝对正确”，
  // 而是尽量做一层比单纯 rerank 更保守的裁剪。
  //
  // 这里采用的是：
  // - 先给每条记录标出噪音原因
  // - 再根据原因数量 / 是否命中 hint / 是否属于优先 section 来决定保留
  //
  // 这样比“一个固定 score 阈值”更贴近当前业务场景。
  if (!Array.isArray(matches) || matches.length === 0) {
    return {
      kept: [],
      dropped: [],
    };
  }

  const leader = matches[0];
  const questionKeywords = extractQuestionKeywords(question);
  const preferredSections = preferredSectionsForStrategy(strategy);
  // minKeep 是一个兜底参数：
  // 防止去噪过猛，最后 prompt 里几乎没证据可用。
  const minKeep = Number(options.minKeep || 4);

  const inspected = matches.map((item) => {
    const reasons = detectNoiseReasons(item, leader, strategy, questionKeywords);
    const isPreferredSection = preferredSections.includes(item.section);
    const hasHints = Number(item._matchedHintCount || 0) > 0;

    // 当前保留逻辑是一个折中版本：
    // - 噪音原因不多，可以留
    // - 命中了主题 hint，可以留
    // - 即便 reasons 稍多，但如果它属于优先 section 且 rerank 分够高，也留
    const keep =
      reasons.length <= 2 ||
      hasHints ||
      (isPreferredSection && Number(item._rerankScore || 0) >= 0.63);

    return {
      ...item,
      _noiseReasons: reasons,
      _keptAfterDenoise: keep,
    };
  });

  const kept = inspected.filter((item) => item._keptAfterDenoise);
  const dropped = inspected.filter((item) => !item._keptAfterDenoise);

  if (kept.length < minKeep) {
    // 如果去噪后剩余结果太少，就回退到重排结果的前几条。
    // 这是一个“宁可保守不过滤太狠”的兜底策略。
    return {
      kept: matches.slice(0, Math.max(minKeep, 1)).map((item) => ({
        ...item,
        _noiseReasons: ['去噪后剩余结果过少，回退到重排结果'],
        _keptAfterDenoise: true,
      })),
      dropped: [],
    };
  }

  return {
    kept,
    dropped,
  };
}

export async function runRAGv4({
  client,
  model,
  collectionName,
  question,
  history = [],
  topK = 8,
  candidateTopK = Math.max(topK * 2, 10),
  filter = '',
  metricType = MetricType.COSINE,
  outputFields,
  strategy = '',
  promptTemplate = '',
}) {
  // runRAGv4 是版本 4 的主流程：
  // 1. 判断问题类型
  // 2. 选择 prompt 模板
  // 3. 校验向量维度
  // 4. 做 Milvus 召回
  // 5. 做重排
  // 6. 做去噪
  // 7. 组装 context
  // 8. 渲染 prompt
  // 9. 调用 LLM 生成最终答案
  const resolvedStrategy = strategy || detectQuestionStrategy(question);
  const resolvedTemplate = getTemplateByStrategy(resolvedStrategy, promptTemplate);

  const collectionDetail = await client.describeCollection({
    collection_name: collectionName,
  });

  const collectionVectorDim = getCollectionVectorDim(collectionDetail);
  const queryVector = await getEmbedding(question);
  const { nonZeroCount } = validateEmbedding(queryVector, 'query embedding');

  if (queryVector.length !== collectionVectorDim) {
    throw new Error(
      `查询向量维度与集合不一致：集合为 ${collectionVectorDim}，当前 embedding 为 ${queryVector.length}`
    );
  }

  // 第一阶段：原始向量召回。
  const rawMatches = await retrieve(client, queryVector, {
    collectionName,
    topK: candidateTopK,
    metricType,
    filter,
    outputFields,
  });

  // 第二阶段：业务规则重排。
  const rerankedMatches = rerankMatches(rawMatches, question, resolvedStrategy);
  // 第三阶段：噪音裁剪。
  const { kept: denoisedMatches, dropped: droppedMatches } = denoiseMatches(
    rerankedMatches,
    question,
    resolvedStrategy,
    {
      minKeep: Math.min(topK, 4),
    }
  );

  // 最终只取前 topK 条进入 prompt。
  const finalMatches = denoisedMatches.slice(0, topK);
  const context = formatContext(finalMatches);
  // 注意这里 buildPrompt 已经变成“读模板文件 + 变量插值”，
  // 不再是硬编码字符串。
  const prompt = await buildPrompt(resolvedTemplate, {
    history: formatHistory(history),
    context,
    question,
  });

  // 最后才交给大模型生成自然语言答案。
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
    denoisedMatches,
    droppedMatches,
    finalMatches,
    context,
    prompt,
    answer: response.content,
  };
}
