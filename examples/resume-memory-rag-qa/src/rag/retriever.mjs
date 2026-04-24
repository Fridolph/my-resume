import { MetricType } from '@zilliz/milvus2-sdk-node';

// Retriever 只负责一件事：
// 接收“已经向量化好的 queryVector”，去 Milvus 取回候选片段。
//
// 这样后面无论是：
// - 简历问答
// - 技能评估
// - 岗位匹配
// 都可以复用这一层。
export async function retrieve(client, queryVector, options = {}) {
  const {
    collectionName,
    topK = 5,
    metricType = MetricType.COSINE,
    filter = '',
    outputFields = [
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
  } = options;

  if (!collectionName) {
    throw new Error('[retriever] collectionName 是必填参数');
  }

  const payload = {
    collection_name: collectionName,
    vector: queryVector,
    limit: topK,
    metric_type: metricType,
    output_fields: outputFields,
  };

  if (filter) {
    payload.filter = filter;
  }

  const result = await client.search(payload);
  return result.results || [];
}
