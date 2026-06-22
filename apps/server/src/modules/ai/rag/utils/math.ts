/**
 * 计算两个向量的余弦相似度。
 *
 * 返回 0~1 之间的值，1 表示完全同向。任一向量为空或模为零时返回 0。
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length === 0 || vectorB.length === 0) {
    return 0
  }

  const length = Math.min(vectorA.length, vectorB.length)
  let dot = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let index = 0; index < length; index += 1) {
    dot += vectorA[index] * vectorB[index]
    magnitudeA += vectorA[index] * vectorA[index]
    magnitudeB += vectorB[index] * vectorB[index]
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
}
