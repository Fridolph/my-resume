import 'dotenv/config';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { ChatOpenAI } from '@langchain/openai';
import {
  appendSessionTurn,
  loadSession,
  resetSession,
  sessionToPromptHistory,
} from './rag4/history-store.mjs';
import { runRAGv5 } from './rag5/rag-pipeline-v5.mjs';

const COLLECTION_NAME = process.env.RESUME_RAG_COLLECTION || 'resume_profile_chunks';
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';

function parseArgs(argv) {
  const options = {
    sessionId: 'resume-demo-v5',
    topK: 8,
    candidateTopK: 16,
    filter: '',
    promptTemplate: '',
    resetSession: false,
  };
  const questionParts = [];

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--session') {
      options.sessionId = argv[index + 1] || options.sessionId;
      index += 1;
      continue;
    }

    if (current === '--topK') {
      options.topK = Number(argv[index + 1] || options.topK);
      index += 1;
      continue;
    }

    if (current === '--candidateTopK') {
      options.candidateTopK = Number(argv[index + 1] || options.candidateTopK);
      index += 1;
      continue;
    }

    if (current === '--filter') {
      options.filter = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (current === '--template') {
      options.promptTemplate = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (current === '--reset-session') {
      options.resetSession = true;
      continue;
    }

    if (current !== '--') {
      questionParts.push(current);
    }
  }

  return {
    ...options,
    question:
      questionParts.join(' ').trim() || '这个候选人有哪些 AI Agent 开发相关经验？',
  };
}

function printMatches(title, matches) {
  console.log(`${title}:\n`);

  matches.forEach((item, index) => {
    const rawScore = Number(item._baseScore ?? item.score ?? 0).toFixed(4);
    const rerankScore = Number(item._rerankScore ?? item.score ?? 0).toFixed(4);

    console.log(
      `${index + 1}. [raw=${rawScore} | rerank=${rerankScore}] ${item.section} / ${item.subsection_title} / ${item.entity_type}`
    );
    console.log(
      `   boosts: section=${Number(item._sectionBoost ?? 0).toFixed(3)}, keyword=${Number(item._keywordBoost ?? 0).toFixed(3)}, hints=${Number(item._matchedHintCount ?? 0)}`
    );

    if (Array.isArray(item._noiseReasons) && item._noiseReasons.length > 0) {
      console.log(`   noiseCheck: ${item._noiseReasons.join('；')}`);
    }

    console.log(`   subsectionKey: ${item.subsection_key}`);
    console.log(`   tags: ${Array.isArray(item.tags) ? item.tags.join(', ') : ''}`);
    console.log(`   content: ${String(item.content).slice(0, 180)}\n`);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.resetSession) {
    await resetSession(args.sessionId);
    console.log(`Session reset: ${args.sessionId}`);
    return;
  }

  const session = await loadSession(args.sessionId);
  const history = sessionToPromptHistory(session, 3);

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

  console.log(`Session: ${args.sessionId}`);
  console.log(`Loaded history turns: ${session.turns.length}`);
  console.log(`Prompt history messages: ${history.length}\n`);

  const result = await runRAGv5({
    client,
    model,
    collectionName: COLLECTION_NAME,
    question: args.question,
    history,
    topK: args.topK,
    candidateTopK: args.candidateTopK,
    filter: args.filter,
    promptTemplate: args.promptTemplate,
  });

  await appendSessionTurn(args.sessionId, {
    question: args.question,
    answer: result.answer,
    strategy: result.strategy,
    promptTemplate: result.promptTemplate,
    finalMatchCount: result.finalMatches.length,
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

  printMatches('Raw candidates', result.rawMatches);
  printMatches('Reranked candidates', result.rerankedMatches.slice(0, result.topK));
  printMatches('Denoised final candidates', result.finalMatches);

  if (result.droppedMatches.length > 0) {
    printMatches('Dropped noisy candidates', result.droppedMatches.slice(0, 6));
  }

  console.log(`Messages count sent to model: ${result.messages.length}\n`);
  console.log('Answer:\n');
  console.log(result.answer);
}

main().catch((error) => {
  console.error('ask-5 failed:', error);
  process.exit(1);
});
