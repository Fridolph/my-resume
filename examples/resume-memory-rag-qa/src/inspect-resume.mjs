// 这个脚本只做一件事：
// 在“真正写入 Milvus 之前”，先把简历解析和 chunk 结果打印出来，方便我们检查：
// 1. section / subsection 拆得对不对
// 2. subsection_title / content 有没有明显异常
// 3. chunk 数量是否符合预期
//
// 学习时建议先跑 inspect，再跑 ingest。
import { buildResumeChunkPlan, DEFAULT_RESUME_PATH } from './resume-parser.mjs';

function pickInspectRecords(records) {
  if (records.length <= 24) {
    return records;
  }

  const head = records.slice(0, 3);
  const tail = records.slice(-3);
  const middlePool = records.slice(3, -3);

  const shuffledMiddle = [...middlePool].sort(() => Math.random() - 0.5);
  const randomMiddle = shuffledMiddle.slice(0, 18);

  return [...head, ...randomMiddle, ...tail];
}

async function main() {
  // buildResumeChunkPlan 是整个 demo 的“解析总入口”：
  // 它会先把 markdown 简历拆成语义记录 records，
  // 再根据 chunkSize / chunkOverlap 产出最终 chunks。
  const plan = await buildResumeChunkPlan(DEFAULT_RESUME_PATH);

  console.log(`Resume source: ${plan.filePath}`);
  console.log(`Semantic records: ${plan.recordCount}`);
  console.log(`Chunked records: ${plan.chunkCount}\n`);

  // 这里只打印：
  // - 前 3 条
  // - 中间随机 18 条
  // - 最后 3 条
  //
  // 这样既保留了结构首尾，也能抽样检查中间内容。
  // 真正关注的是：
  // - section / subsectionKey / subsectionTitle：是不是符合我们对简历结构的理解
  // - entityType：这条记录在业务上属于什么类型
  // - chars：后面 chunk 时大概会不会被切开
  // - preview：肉眼快速确认内容有没有跑偏
  const inspectRecords = pickInspectRecords(plan.records);

  console.table(
    inspectRecords.map((record) => ({
      section: record.section,
      subsectionKey: record.subsectionKey,
      subsectionTitle: record.subsectionTitle,
      entityType: record.entityType,
      previewChars: record.content.length,
      preview: record.content.slice(0, 48),
    }))
  );
}

main().catch((error) => {
  // demo 脚本统一在入口兜底，方便学习时直接看到报错。
  console.error('inspect failed:', error);
  process.exit(1);
});
