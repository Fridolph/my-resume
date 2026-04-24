import 'dotenv/config';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { ChatOpenAI } from '@langchain/openai';
import {
  appendSessionTurn,
  loadSession,
  resetSession,
  sessionToPromptHistory,
} from './rag4/history-store.mjs';
import { runRAGv4 } from './rag4/rag-pipeline-v4.mjs';

// 这里仍然保留最基础的“运行环境配置”：
// - collection 名称
// - Milvus 地址
//
// 但和 ask 3 不同的是：
// 这次不再额外引入一堆新的 env 变量，
// 而是把“更容易频繁变化的实验参数”放到 CLI 参数里。
const COLLECTION_NAME = process.env.RESUME_RAG_COLLECTION || 'resume_profile_chunks';
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';

function parseArgs(argv) {
  // 这个函数负责把命令行参数解析成一个统一 options 对象。
  //
  // 为什么这里自己手写，而不是直接引入 commander / yargs？
  // 因为当前还是学习 demo：
  // - 参数量不多
  // - 逻辑比较直白
  // - 手写更容易看清 CLI 脚本到底做了什么
  //
  // 后续如果参数继续膨胀，再考虑引入成熟的 CLI 库。
  const options = {
    // sessionId：当前会话的唯一标识。
    // 不同 session 对应不同本地会话文件。
    sessionId: 'resume-demo',
    // topK：最终送进 prompt 的片段条数。
    topK: 8,
    // candidateTopK：初步候选池数量。
    // 先召回更多，再重排、去噪，最后截断到 topK。
    candidateTopK: 16,
    // filter：Milvus 过滤表达式。
    // 当前是可选能力，不强依赖。
    filter: '',
    // promptTemplate：允许手工指定模板名。
    // 如果不传，就交给 pipeline 根据 strategy 自动选模板。
    promptTemplate: '',
    // resetSession：只做“清空会话历史”操作，不执行问答。
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
      // 所有未被识别为参数选项的内容，都认为是问题正文的一部分。
      // 这样就能兼容：
      // node ask.mjs "一个完整问题"
      // node ask.mjs 这个 候选人 有 哪些 AI Agent 开发 经验
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
  // 统一的打印函数：
  // - 原始召回
  // - 重排结果
  // - 去噪后结果
  // - 被丢弃的噪声结果
  //
  // 为什么要抽成函数？
  // 因为这几类输出结构相同，只是标题不同。
  // 抽出来后，更方便你学习“同一条记录在不同阶段发生了什么变化”。
  console.log(`${title}:\n`);

  matches.forEach((item, index) => {
    // _baseScore / _rerankScore 是我们在 pipeline 阶段附加上的调试字段。
    // 如果当前记录还没有进入重排流程，就回退到 Milvus 原始 score。
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
  // 对 CLI 脚本来说，main() 就是“顶层编排入口”。
  // 它本身尽量不做复杂业务判断，而是负责：
  // 1. 读取参数
  // 2. 准备 session
  // 3. 初始化 model / client
  // 4. 调用 pipeline
  // 5. 保存会话结果
  // 6. 打印调试信息
  const args = parseArgs(process.argv.slice(2));

  if (args.resetSession) {
    // reset 模式下，不做问答，只清空对应 session 文件。
    await resetSession(args.sessionId);
    console.log(`Session reset: ${args.sessionId}`);
    return;
  }

  // 先读本地 session 文件，再把其中最近几轮对话转成 prompt 可用的 history。
  //
  // 注意：
  // 这里并没有把“整个历史文件”原样塞给模型，
  // 而是只取最近若干轮，避免 prompt 无限膨胀。
  const session = await loadSession(args.sessionId);
  const history = sessionToPromptHistory(session, 3);

  // model 和 client 移到 main() 内部初始化，
  // 是为了让脚本的运行上下文更明确：
  // 每次执行就是一次完整的“独立问答 run”。
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

  // runRAGv4 是当前版本真正的“核心流程”。
  // 这个脚本只负责把 CLI 参数和运行上下文塞进去。
  const result = await runRAGv4({
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

  // 问答完成后，把这一轮写回本地 session store。
  //
  // 当前保存的是：
  // - question
  // - answer
  // - strategy
  // - promptTemplate
  // - finalMatchCount
  //
  // 为什么不是只存 answer？
  // 因为多轮对话要理解“上一轮回答是针对哪个问题生成的”，
  // 所以 question + answer 必须成对保留。
  await appendSessionTurn(args.sessionId, {
    question: args.question,
    answer: result.answer,
    strategy: result.strategy,
    promptTemplate: result.promptTemplate,
    finalMatchCount: result.finalMatches.length,
  });

  // 这一段日志是学习用输出。
  // 重点是让你在运行脚本时，不只是看到“最终答案”，
  // 而是能逐步看清：
  // - 问题被识别成什么 strategy
  // - 选中了哪个 prompt 模板
  // - 候选召回多少条
  // - 最终保留了多少条
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

  // 最后再打印模型答案。
  console.log('Answer:\n');
  console.log(result.answer);
}

main().catch((error) => {
  // CLI demo 统一在入口兜底，避免 Promise rejection 直接吞掉栈信息。
  console.error('ask-4 failed:', error);
  process.exit(1);
});
