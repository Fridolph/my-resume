import 'dotenv/config';
import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  // 在生成嵌入时，每次会处理最多 10 个输入数据
  // 这种批量处理可以提高效率，减少 API 请求次数
  batchSize: 10,
});

function normalizeEmbeddingsEndpoint(url) {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  return trimmed.endsWith('/embeddings')
    ? trimmed
    : `${trimmed.replace(/\/+$/, '')}/embeddings`;
}

function getEmbeddingsEndpointCandidates() {
  const candidates = [
    normalizeEmbeddingsEndpoint(process.env.EMBEDDINGS_URL),
    normalizeEmbeddingsEndpoint(process.env.OPENAI_BASE_URL),
  ].filter(Boolean);

  return [...new Set(candidates)];
}

export async function getEmbedding(text) {
  const endpoints = getEmbeddingsEndpointCandidates();

  if (endpoints.length > 0) {
    let lastError;

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.EMBEDDINGS_MODEL_NAME,
          input: text,
        }),
      });

      if (!response.ok) {
        lastError = `embedding 请求失败: ${response.status} ${await response.text()} (url: ${endpoint})`;
        continue;
      }

      const result = await response.json();
      // 业界通用格式，openai的这里是数组
      const vector = result.data?.[0]?.embedding;

      if (!Array.isArray(vector)) {
        throw new Error(`embedding 响应格式异常: ${JSON.stringify(result)}`);
      }

      return vector;
    }

    throw new Error(lastError || 'embedding 请求失败：没有可用的 embeddings endpoint');
  }

  // LangChain 内部帮你封装了 fetch + 解析 + 提取的全套逻辑
  // 等价于上面手动 fetch 那一大段代码，可理解为兜底
  return embeddings.embedQuery(text);
}

export function validateEmbedding(vector, label = 'embedding') {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error(`${label} 为空，请检查 EMBEDDINGS_MODEL_NAME / EMBEDDINGS_URL`);
  }

  const nonZeroCount = vector.filter((value) => value !== 0).length;

  if (nonZeroCount === 0) {
    throw new Error(`${label} 全部为 0，请检查 EMBEDDINGS_MODEL_NAME / EMBEDDINGS_URL / OPENAI_BASE_URL`);
  }

  return {
    dimension: vector.length,
    nonZeroCount,
  };
}

export async function resolveVectorDim() {
  const probeVector = await getEmbedding('resume vector dimension probe');
  const { dimension } = validateEmbedding(probeVector, 'probe embedding');
  return dimension;
}
