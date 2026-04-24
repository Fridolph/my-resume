// 这个脚本演示“简历 RAG 问答”的读取链路：
// 1. 用户提问
// 2. 把问题向量化
// 3. 去 Milvus 做相似度检索
// 4. 把召回片段拼进 prompt
// 5. 交给大模型生成最终回答
import 'dotenv/config';
import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node';
import { ChatOpenAI } from '@langchain/openai';
import { getEmbedding, validateEmbedding } from './embedding-client.mjs';

const COLLECTION_NAME = process.env.RESUME_RAG_COLLECTION || 'resume_profile_chunks';
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';
const TOP_K = Number(process.env.RESUME_RAG_TOP_K || 5);

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
  // 查询前先读集合 schema，避免“查询向量维度”和“库存向量维度”不一致。
  const dim = detail?.schema?.fields?.find((field) => field.name === 'vector')?.dim;
  return Number(dim || 0);
}

async function main() {
  // 兼容 `pnpm run ask -- "问题"` 这种调用方式。
  // 有些 npm/pnpm 会把 `--` 也传进 argv，这里顺手过滤掉。
  const question =
    process.argv
      .slice(2)
      .filter((item) => item !== '--')
      .join(' ')
      .trim() || '这个候选人有哪些 AI Agent 开发相关经验？';

  console.log(`Connecting to Milvus at ${MILVUS_ADDRESS}...`);
  await client.connectPromise;
  console.log('Connected.\n');

  // 先确认 collection 维度，再生成 query embedding。
  const collectionDetail = await client.describeCollection({
    collection_name: COLLECTION_NAME,
  });
  const collectionVectorDim = getCollectionVectorDim(collectionDetail);
  const queryVector = await getEmbedding(question);
  const { nonZeroCount } = validateEmbedding(queryVector, 'query embedding');
  console.log(`Query embedding check: dim=${queryVector.length}, nonZero=${nonZeroCount}/${queryVector.length}`);
  if (queryVector.length !== collectionVectorDim) {
    // 这一步能很快暴露“写入模型”和“查询模型”不一致的问题。
    throw new Error(
      `查询向量维度与集合不一致：集合为 ${collectionVectorDim}，当前 embedding 为 ${queryVector.length}`
    );
  }

  const searchResult = await client.search({
    // 这里只做最基础的向量召回，不加 filter / rerank，方便先把主流程看清楚。
    collection_name: COLLECTION_NAME,
    vector: queryVector,
    limit: TOP_K,
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

  console.log(`Question: ${question}\n`);
  console.log('Top matches:\n');
  matches.forEach((item, index) => {
    // 先把召回证据打印出来，学习时非常重要。
    // 不要一上来只看最终 AI 回答，否则容易误把“生成问题”当成“召回问题”。
    console.log(
      `${index + 1}. [${Number(item.score).toFixed(4)}] ${item.section} / ${item.subsection_title} / ${item.entity_type}`
    );
    console.log(`   subsectionKey: ${item.subsection_key}`);
    console.log(`   tags: ${Array.isArray(item.tags) ? item.tags.join(', ') : ''}`);
    console.log(`   content: ${String(item.content).slice(0, 180)}\n`);
  });

  const context = matches
    .map(
      (item, index) => `[片段 ${index + 1}]
section: ${item.section}
subsectionKey: ${item.subsection_key}
subsectionTitle: ${item.subsection_title}
entityType: ${item.entity_type}
content: ${item.content}`
    )
    .join('\n\n-----\n\n');

  // 这里是一个非常朴素但清晰的 RAG prompt：
  // - 限制“只基于片段回答”
  // - 证据不足时要明确说不知道
  // - 鼓励引用 section 和具体事实
  const prompt = `你是一个简历问答助手。请只基于给定的简历片段回答问题，不要脑补。

如果有片段关联：
1. 片段证据不足时，请明确说“当前检索到的简历片段不足以确认这个问题”；
2. 不足以确认，但有相关字段或者经历，向提问者告知会记录下来，并以谦虚的态度解释相关理解；

## 限制

- 简历外的信息，技术博客，AI学习，易经学习，个人生活，兴趣爱好相关可，但禁止回答用户隐私和其他无关提问；
- 禁止回答违反法律，社会价值道德观等问题，并警告提问者会进行后台记录。

简历片段：
${context}

问题：${question}

回答要求：
1. 先给结论。
2. 尽量简短、概括引用片段中的具体事实。
3. 如果是经历或技能总结，请指出来自哪些 section。

回答：`;

  const response = await model.invoke(prompt);
  console.log('Answer:\n');
  console.log(response.content);
}

main().catch((error) => {
  // demo 脚本统一兜底。
  console.error('ask failed:', error);
  process.exit(1);
});
