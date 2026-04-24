import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MetricType } from '@zilliz/milvus2-sdk-node';
import { getEmbedding, validateEmbedding } from '../embedding-client.mjs';
import { retrieve } from '../rag/retriever.mjs';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const KEYWORD_HINTS_PATH = path.join(CURRENT_DIR, 'config', 'keyword-hints.json');
const SECTION_BOOST_CONFIG_PATH = path.join(CURRENT_DIR, 'config', 'section-boost-config.json');
const RERANK_CONFIG_PATH = path.join(CURRENT_DIR, 'config', 'rerank-config.json');

let keywordHintsCache = null;
let sectionBoostConfigCache = null;
let rerankConfigCache = null;

function getCollectionVectorDim(detail) {
  const dim = detail?.schema?.fields?.find((field) => field.name === 'vector')?.dim;
  return Number(dim || 0);
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

async function loadKeywordHintsConfig() {
  if (keywordHintsCache) {
    return keywordHintsCache;
  }

  const raw = await fs.readFile(KEYWORD_HINTS_PATH, 'utf8');
  keywordHintsCache = JSON.parse(raw);
  return keywordHintsCache;
}

async function loadSectionBoostConfig() {
  if (sectionBoostConfigCache) {
    return sectionBoostConfigCache;
  }

  const raw = await fs.readFile(SECTION_BOOST_CONFIG_PATH, 'utf8');
  sectionBoostConfigCache = JSON.parse(raw);
  return sectionBoostConfigCache;
}

async function loadRerankConfig() {
  if (rerankConfigCache) {
    return rerankConfigCache;
  }

  const raw = await fs.readFile(RERANK_CONFIG_PATH, 'utf8');
  rerankConfigCache = JSON.parse(raw);
  return rerankConfigCache;
}

export function detectQuestionStrategy(question) {
  // 版本 5 修正点：
  // 这里不再让“项目”提前被 experience 分支吞掉。
  //
  // 规则是：
  // 1. 先识别 job_match / skill 这类明显问题
  // 2. 再判断“纯项目类”
  // 3. 最后再判断经历类
  const normalized = normalizeText(question);

  if (/岗位|匹配|胜任|合适吗|适合吗|符合/.test(normalized)) {
    return 'job_match';
  }

  if (/技能|擅长|会什么|技术栈|掌握|熟悉|能力如何/.test(normalized)) {
    return 'skill';
  }

  const hasProject = /项目|作品|案例/.test(normalized);
  const hasExperience = /经验|经历|做过|负责过|实战|落地|主导|参与|开发相关经验/.test(normalized);

  if (hasProject && !hasExperience) {
    return 'project';
  }

  if (hasExperience) {
    return 'experience';
  }

  if (hasProject) {
    return 'project';
  }

  return 'general';
}

async function getKeywordHints(question) {
  const normalized = normalizeText(question);
  const keywordHintsConfig = await loadKeywordHintsConfig();
  const result = new Set();

  for (const [trigger, expansions] of Object.entries(keywordHintsConfig)) {
    if (normalized.includes(normalizeText(trigger))) {
      expansions.forEach((item) => result.add(item));
    }
  }

  return [...result];
}

function getEntityWeight(config, section, entityType) {
  const sectionConfig = config?.[section] || config?.__default;

  if (!sectionConfig) {
    return 0;
  }

  if (String(entityType || '').includes('summary') && typeof sectionConfig.summary === 'number') {
    return sectionConfig.summary;
  }

  return Number(sectionConfig.default || 0);
}

async function scoreSectionBoost(item, strategy) {
  const sectionBoostConfig = await loadSectionBoostConfig();
  const strategyConfig = sectionBoostConfig?.[strategy];

  if (!strategyConfig) {
    return 0;
  }

  return getEntityWeight(strategyConfig, item.section, item.entity_type || item.entityType);
}

async function scoreKeywordBoost(item, keywordHints) {
  const rerankConfig = await loadRerankConfig();
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
      boost += Number(rerankConfig.keywordBoostPerHit || 0.015);
    }
  }

  return {
    matchedHintCount,
    boost: Math.min(boost, Number(rerankConfig.keywordBoostMax || 0.09)),
  };
}

async function rerankMatches(matches, question, strategy) {
  const keywordHints = await getKeywordHints(question);

  const scored = await Promise.all(
    matches.map(async (item, index) => {
      const baseScore = Number(item.score || 0);
      const sectionBoost = await scoreSectionBoost(item, strategy);
      const { boost: keywordBoost, matchedHintCount } = await scoreKeywordBoost(item, keywordHints);
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
  );

  return scored.sort((a, b) => b._rerankScore - a._rerankScore);
}

function preferredSectionsForStrategy(strategy) {
  if (strategy === 'experience') return ['projects', 'work_experience', 'core_strengths'];
  if (strategy === 'project') return ['projects', 'work_experience'];
  if (strategy === 'skill') return ['skills', 'core_strengths', 'projects'];
  return ['projects', 'work_experience', 'skills', 'core_strengths', 'profile'];
}

function extractQuestionKeywords(question) {
  const normalized = normalizeText(question);
  const keywords = new Set();

  if (normalized.includes('ai')) keywords.add('ai');
  if (normalized.includes('agent')) keywords.add('agent');
  if (normalized.includes('sse') || normalized.includes('流式')) keywords.add('sse');
  if (normalized.includes('工作流')) keywords.add('工作流');
  if (normalized.includes('my-resume')) keywords.add('my-resume');

  return [...keywords];
}

async function detectNoiseReasons(item, leader, strategy, questionKeywords) {
  const rerankConfig = await loadRerankConfig();
  const reasons = [];
  const preferredSections = preferredSectionsForStrategy(strategy);
  const isPreferredSection = preferredSections.includes(item.section);
  const hasHints = Number(item._matchedHintCount || 0) > 0;
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
    reasons.push('非当前问题优先 section');
  }

  if (!hasHints && questionKeywords.length > 0) {
    reasons.push('未命中主题 hint');
  }

  if (!topicHit && questionKeywords.length > 0) {
    reasons.push('与问题主题缺少直接文本关联');
  }

  if (rerankGap > 0.14) {
    reasons.push('与头部结果分差过大');
  }

  if (rawScore < Number(rerankConfig.rawScoreNoiseThreshold || 0.5)) {
    reasons.push('原始向量分低于当前经验阈值');
  }

  if (rerankScore < 0.6) {
    reasons.push('重排后分数偏低');
  }

  if ((strategy === 'experience' || strategy === 'project') && !hasHints && item.section !== 'core_strengths') {
    reasons.push('经验类问题下缺少主题证据');
  }

  return [...new Set(reasons)];
}

async function denoiseMatches(matches, question, strategy, options = {}) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return {
      kept: [],
      dropped: [],
    };
  }

  const rerankConfig = await loadRerankConfig();
  const leader = matches[0];
  const questionKeywords = extractQuestionKeywords(question);
  const preferredSections = preferredSectionsForStrategy(strategy);
  const minKeep = Number(options.minKeep || 4);

  const inspected = await Promise.all(
    matches.map(async (item) => {
      const reasons = await detectNoiseReasons(item, leader, strategy, questionKeywords);
      const isPreferredSection = preferredSections.includes(item.section);
      const hasHints = Number(item._matchedHintCount || 0) > 0;
      const rawScore = Number(item._baseScore || item.score || 0);
      const rawThreshold = Number(rerankConfig.rawScoreNoiseThreshold || 0.5);
      const preferredKeepScore = Number(rerankConfig.preferredSectionKeepScore || 0.63);

      // 这里版本 5 做了一个更强的“低分先验过滤”：
      // - 如果 raw score 已经低于当前数据集经验阈值
      // - 且又没有 hint、也不在优先 section
      // 那它更像是“沾边召回”，直接倾向丢弃
      const hardNoise = rawScore < rawThreshold && !hasHints && !isPreferredSection;

      const keep =
        !hardNoise &&
        (
          reasons.length <= 2 ||
          hasHints ||
          (isPreferredSection && Number(item._rerankScore || 0) >= preferredKeepScore)
        );

      return {
        ...item,
        _noiseReasons: reasons,
        _keptAfterDenoise: keep,
      };
    })
  );

  const kept = inspected.filter((item) => item._keptAfterDenoise);
  const dropped = inspected.filter((item) => !item._keptAfterDenoise);

  if (kept.length < minKeep) {
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

export function formatContext(matches) {
  // 版本 5 修正点：
  // 这里不再把 rawScore / rerankScore 注入 Prompt。
  //
  // 给模型看的 context 应该以“业务证据”为主，
  // 分数保留在日志即可。
  return matches
    .map(
      (item, index) => `[片段 ${index + 1}]
section: ${item.section}
subsectionKey: ${item.subsection_key}
subsectionTitle: ${item.subsection_title}
entityType: ${item.entity_type}
content: ${item.content}`
    )
    .join('\n\n-----\n\n');
}

export async function buildRAGContext({
  client,
  collectionName,
  question,
  topK = 8,
  candidateTopK = Math.max(topK * 2, 10),
  filter = '',
  metricType = MetricType.COSINE,
  outputFields,
  strategy = '',
}) {
  // buildRAGContext() 只负责“证据准备”：
  // - 向量化
  // - 召回
  // - 重排
  // - 去噪
  // - 组装上下文
  //
  // 不负责调用 LLM。
  const resolvedStrategy = strategy || detectQuestionStrategy(question);

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

  const rawMatches = await retrieve(client, queryVector, {
    collectionName,
    topK: candidateTopK,
    metricType,
    filter,
    outputFields,
  });

  const rerankedMatches = await rerankMatches(rawMatches, question, resolvedStrategy);
  const { kept: denoisedMatches, dropped: droppedMatches } = await denoiseMatches(
    rerankedMatches,
    question,
    resolvedStrategy,
    {
      minKeep: Math.min(topK, 4),
    }
  );

  const finalMatches = denoisedMatches.slice(0, topK);
  const context = formatContext(finalMatches);

  return {
    question,
    strategy: resolvedStrategy,
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
  };
}
