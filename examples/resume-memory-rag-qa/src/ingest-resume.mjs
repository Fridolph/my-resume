// 这个脚本负责把“已经结构化并 chunk 完的简历内容”写入 Milvus。
//
// 整个流程是：
// 1. 连接 Milvus
// 2. 动态探测 embedding 维度
// 3. 确保 collection 存在且 schema 正确
// 4. 解析简历、生成 chunks
// 5. 对每个 chunk 做 embedding
// 6. 批量插入 Milvus
// 7. flush 后查询真实行数，确认写入成功
import 'dotenv/config';
import { MilvusClient, DataType, IndexType, MetricType } from '@zilliz/milvus2-sdk-node';
import { buildResumeChunkPlan, DEFAULT_RESUME_PATH } from './resume-parser.mjs';
import { getEmbedding, resolveVectorDim, validateEmbedding } from './embedding-client.mjs';

const COLLECTION_NAME = process.env.RESUME_RAG_COLLECTION || 'resume_profile_chunks';
const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';

const client = new MilvusClient({
  address: MILVUS_ADDRESS,
});

function sleep(ms) {
  // 某些 Milvus 操作（尤其 drop + recreate 后）存在短暂的元数据传播延迟。
  // 这里做一个简单 sleep，配合重试逻辑使用。
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trimByBytes(value, maxBytes) {
  // 这个函数是这次排查里非常重要的“防炸兜底”。
  //
  // 注意：
  // Milvus 的 VarChar / Array<VarChar> 长度限制，本质上要按字节风险来考虑，
  // 中文通常比英文占更多字节。
  //
  // 所以不能只看 JS 的字符串 length，要按 Buffer.byteLength 处理更稳。
  if (Buffer.byteLength(value, 'utf8') <= maxBytes) {
    return value;
  }

  let trimmed = value;
  while (trimmed && Buffer.byteLength(trimmed, 'utf8') > maxBytes) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

function getRowCount(stats) {
  // SDK 的返回结构有时会同时出现在 stats 和 data 里，这里统一做一层兼容。
  const raw = stats?.data?.row_count ?? stats?.stats?.find((item) => item.key === 'row_count')?.value ?? 0;
  return Number(raw || 0);
}

function getCollectionVectorDim(detail) {
  // 从 collection schema 里拿向量字段的 dim。
  const dim = detail?.schema?.fields?.find((field) => field.name === 'vector')?.dim;
  return Number(dim || 0);
}

function getCollectionFieldNames(detail) {
  return (detail?.schema?.fields || []).map((field) => field.name).sort();
}

function hasExpectedSchema(detail) {
  const expected = [
    'id',
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
    'vector',
  ].sort();

  const existing = getCollectionFieldNames(detail);

  return expected.length === existing.length && expected.every((field, index) => field === existing[index]);
}

async function ensureCollection(vectorDim) {
  // 这个函数负责“让 collection 处于可写、可搜、且 schema 正确的状态”。
  const hasCollection = await client.hasCollection({
    collection_name: COLLECTION_NAME,
  });

  if (hasCollection.value) {
    // 如果集合已经存在，先检查它的向量维度是否和当前 embedding 模型一致。
    const detail = await client.describeCollection({
      collection_name: COLLECTION_NAME,
    });
    const existingDim = getCollectionVectorDim(detail);
    const schemaMatched = hasExpectedSchema(detail);

    if (existingDim !== vectorDim || !schemaMatched) {
      // 如果维度不一致，说明：
      // - 之前可能换了 embedding 模型
      // - 或者以前的 schema 就写错了
      // - 或者这次字段设计已经升级
      //
      // 这时不能直接继续写，否则后面查询一定有问题。
      console.log(`Collection ${COLLECTION_NAME} schema changed, rebuilding derived demo collection...`);
      await client.dropCollection({
        collection_name: COLLECTION_NAME,
      });
    }
  }

  const shouldCreate = !(await client.hasCollection({
    collection_name: COLLECTION_NAME,
  })).value;

  if (shouldCreate) {
    // collection schema 里，除了 vector，其他字段都是“检索到后用于解释和展示”的元信息。
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        { name: 'id', data_type: DataType.VarChar, max_length: 200, is_primary_key: true },
        { name: 'source_id', data_type: DataType.VarChar, max_length: 120 },
        { name: 'locale', data_type: DataType.VarChar, max_length: 20 },
        { name: 'section', data_type: DataType.VarChar, max_length: 60 },
        { name: 'subsection_key', data_type: DataType.VarChar, max_length: 120 },
        { name: 'subsection_title', data_type: DataType.VarChar, max_length: 300 },
        { name: 'entity_type', data_type: DataType.VarChar, max_length: 80 },
        { name: 'content', data_type: DataType.VarChar, max_length: 12000 },
        { name: 'tags', data_type: DataType.Array, element_type: DataType.VarChar, max_capacity: 20, max_length: 200 },
        { name: 'chunk_index', data_type: DataType.Int32 },
        { name: 'chunk_count', data_type: DataType.Int32 },
        { name: 'vector', data_type: DataType.FloatVector, dim: vectorDim },
      ],
    });

    await client.createIndex({
      // 这里选择 IVF_FLAT + COSINE，是学习 demo 里比较容易理解的一种组合。
      collection_name: COLLECTION_NAME,
      field_name: 'vector',
      index_type: IndexType.IVF_FLAT,
      metric_type: MetricType.COSINE,
      params: { nlist: 1024 },
    });
  }

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      // collection 必须 load 到内存里，后面搜索才会更快。
      await client.loadCollection({ collection_name: COLLECTION_NAME });
      return;
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('already loaded')) {
        return;
      }
      if (attempt === 5 || !message.includes('collection not found')) {
        throw error;
      }
      // drop 后立刻 create/load 时，偶尔会遇到短暂的“collection not found”。
      // 这里做一个轻量重试，避免 demo 因为时序问题误伤学习体验。
      await sleep(500 * attempt);
    }
  }
}

async function deleteExistingSource(sourceId) {
  // 这是一个“同源全量覆盖”的简化策略：
  // 每次重新导入同一份简历前，先按 source_id 删除旧数据，避免重复堆积。
  await client.delete({
    collection_name: COLLECTION_NAME,
    filter: `source_id == "${sourceId}"`,
  });

  // 先 flush 一次，让删除更快进入可见状态。
  await client.flushSync({
    collection_names: [COLLECTION_NAME],
  });
}

async function countVisibleRowsBySource(sourceId) {
  const result = await client.query({
    collection_name: COLLECTION_NAME,
    filter: `source_id == "${sourceId}"`,
    output_fields: ['id'],
  });

  return result.data?.length || 0;
}

async function main() {
  console.log(`Connecting to Milvus at ${MILVUS_ADDRESS}...`);
  await client.connectPromise;
  console.log('Connected.\n');

  // 第一步先拿到真实 embedding dim，后面建库和查询都靠它。
  const vectorDim = await resolveVectorDim();
  console.log(`Embedding vector dim: ${vectorDim}`);

  await ensureCollection(vectorDim);

  // 第二步：把简历变成结构化 chunks。
  const plan = await buildResumeChunkPlan(DEFAULT_RESUME_PATH);
  console.log(`Parsed ${plan.recordCount} semantic records into ${plan.chunkCount} chunks.`);

  // For this learning demo we fully replace the same resume source to avoid duplicate chunks.
  await deleteExistingSource(plan.chunks[0]?.sourceId || 'resume');

  const rows = [];
  for (const chunk of plan.chunks) {
    // 第三步：每个 chunk 生成对应向量。
    const vector = await getEmbedding(chunk.content);
    const { nonZeroCount } = validateEmbedding(vector, `chunk ${chunk.id} 的 embedding`);
    if (vector.length !== vectorDim) {
      // 再做一次防御式校验，避免 embedding 服务切换后悄悄出现维度漂移。
      throw new Error(`chunk ${chunk.id} 的向量维度异常：期望 ${vectorDim}，实际 ${vector.length}`);
    }
    rows.push({
      id: chunk.id,
      source_id: chunk.sourceId,
      locale: chunk.locale,
      section: chunk.section,
      subsection_key: trimByBytes(chunk.subsectionKey, 120),
      subsection_title: trimByBytes(chunk.subsectionTitle, 300),
      entity_type: chunk.entityType,
      content: chunk.content,
      // tags 也是 schema 的一部分，仍然需要做字节长度兜底。
      tags: (chunk.tags || []).map((tag) => trimByBytes(String(tag), 200)),
      chunk_index: chunk.chunkIndex,
      chunk_count: chunk.chunkCount,
      vector,
    });

    if (rows.length === 1) {
      console.log(`First chunk embedding check: dim=${vector.length}, nonZero=${nonZeroCount}/${vector.length}`);
    }
  }

  const result = await client.insert({
    collection_name: COLLECTION_NAME,
    data: rows,
  });

  if (result?.status?.code !== 0) {
    // 这次踩坑的关键经验之一：
    // SDK 不一定直接 throw，所以必须显式检查 status。
    throw new Error(
      `Milvus insert failed: ${result?.status?.reason || result?.status?.error_code || 'unknown error'}`
    );
  }

  await client.flushSync({
    // flush 的目的是把刚插入的数据真正落到可查询状态。
    collection_names: [COLLECTION_NAME],
  });

  const stats = await client.getCollectionStatistics({
    collection_name: COLLECTION_NAME,
  });
  const rowCount = getRowCount(stats);
  const visibleRowCount = await countVisibleRowsBySource(plan.chunks[0]?.sourceId || 'resume');

  // 注意：Milvus 的 row_count 可能包含历史删除记录，因此这里同时打印“当前 source 的可见条数”。
  console.log(
    `Inserted ${visibleRowCount} visible resume chunks into ${COLLECTION_NAME} (collection row_count=${rowCount}).`
  );
  console.table(
    rows.slice(0, 12).map((row) => ({
      section: row.section,
      subsectionKey: row.subsection_key,
      subsectionTitle: row.subsection_title.slice(0, 28),
      entityType: row.entity_type,
      chunkIndex: row.chunk_index,
      chars: row.content.length,
    }))
  );
}

main().catch((error) => {
  // 入口统一兜底，学习时更容易直接看到完整错误。
  console.error('ingest failed:', error);
  process.exit(1);
});
