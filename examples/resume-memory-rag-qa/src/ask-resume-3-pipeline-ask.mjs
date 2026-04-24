// 这是基于“RAG Pipeline”思想的新一版 ask 脚本。
//
// 相比 ask-resume-2-perf-ask.mjs，这一版更强调：
// 1. 主流程抽象
// 2. Prompt 模板可切换
// 3. 召回参数可配置
// 4. 后续更容易扩展多轮对话与其他场景
import 'dotenv/config';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { ChatOpenAI } from '@langchain/openai';
import { runRAG } from './rag/rag-pipeline.mjs';

const COLLECTION_NAME = process.env.RESUME_RAG_COLLECTION || 'resume_profile_chunks';
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';
const TOP_K = Number(process.env.RESUME_RAG_TOP_K || 8);
const CANDIDATE_TOP_K = Number(process.env.RESUME_RAG_CANDIDATE_TOP_K || Math.max(TOP_K * 2, 10));
const FILTER = process.env.RESUME_RAG_FILTER || '';
const PROMPT_TEMPLATE = process.env.RESUME_RAG_PROMPT_TEMPLATE || '';

function parseHistoryFromEnv() {
  const raw = process.env.RESUME_RAG_HISTORY;

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('WARN: RESUME_RAG_HISTORY 不是合法 JSON，已忽略。');
    return [];
  }
}

function printMatches(title, matches, limit) {
  console.log(`${title}:\n`);

  matches.slice(0, limit).forEach((item, index) => {
    const rawScore = Number(item._baseScore ?? item.score ?? 0).toFixed(4);
    const rerankScore = Number(item._rerankScore ?? item.score ?? 0).toFixed(4);

    console.log(
      `${index + 1}. [raw=${rawScore} | rerank=${rerankScore}] ${item.section} / ${item.subsection_title} / ${item.entity_type}`
    );
    console.log(
      `   boosts: section=${Number(item._sectionBoost ?? 0).toFixed(3)}, keyword=${Number(item._keywordBoost ?? 0).toFixed(3)}, hints=${Number(item._matchedHintCount ?? 0)}`
    );
    console.log(`   subsectionKey: ${item.subsection_key}`);
    console.log(`   tags: ${Array.isArray(item.tags) ? item.tags.join(', ') : ''}`);
    console.log(`   content: ${String(item.content).slice(0, 180)}\n`);
  });
}

async function main() {
  const question =
    process.argv
      .slice(2)
      .filter((item) => item !== '--')
      .join(' ')
      .trim() || '这个候选人有哪些 AI Agent 开发相关经验？';

  const history = parseHistoryFromEnv();

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

  console.log(`Connecting to Milvus at ${MILVUS_ADDRESS}...`);
  await client.connectPromise;
  console.log('Connected.\n');

  const result = await runRAG({
    client,
    model,
    collectionName: COLLECTION_NAME,
    question,
    history,
    topK: TOP_K,
    candidateTopK: CANDIDATE_TOP_K,
    filter: FILTER,
    promptTemplate: PROMPT_TEMPLATE,
  });

  console.log(`Question: ${result.question}`);
  console.log(`Question strategy: ${result.strategy}`);
  console.log(`Prompt template: ${result.promptTemplate}`);
  console.log(`Candidate topK: ${result.candidateTopK}`);
  console.log(`Final topK: ${result.topK}`);
  console.log(`Filter: ${result.filter || '(none)'}`);
  console.log(
    `Query embedding check: dim=${result.queryVectorDim}, nonZero=${result.queryNonZeroCount}/${result.queryVectorDim}\n`
  );

  printMatches('Raw candidates', result.rawMatches, result.rawMatches.length);
  printMatches('Reranked candidates', result.finalMatches, result.finalMatches.length);

  console.log('Answer:\n');
  console.log(result.answer);
}

main().catch((error) => {
  console.error('ask-3 failed:', error);
  process.exit(1);
});
