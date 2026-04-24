// 这个文件是整个“简历 RAG demo”的基础设施。
// 它负责把一份 markdown 简历拆成两层结构：
//
// 第一层：语义记录 records
// - 例如：基本信息 / 某个技能点 / 某段工作经历摘要 / 某个项目亮点
//
// 第二层：向量化前的最终 chunks
// - 如果某条 record 太长，再交给 splitter 做二次切块
//
// 为什么这样做？
// 因为简历天然是强结构化文本，先按业务语义拆，比直接整篇硬切更适合后续检索。
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export const DEFAULT_RESUME_PATH =
  process.env.RESUME_SOURCE_PATH ||
  '/Users/fri/Desktop/personal/my-resume/public/fuyinsheng-resume-zh.md';

export const DEFAULT_CHUNK_SIZE = 500;
export const DEFAULT_CHUNK_OVERLAP = 50;

function normalizeInlineMarkdown(text) {
  // 把 markdown 里的粗体、行内代码、链接语法先“去壳”，
  // 让后续存入向量库的是更纯净的自然语言文本。
  return text
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
function slugify(text) {
  // 把标题或 subsection 转成稳定、可读的 key。
  // 这里保留中文，是因为当前 demo 主要服务中文简历，调试时可读性更好。
  return normalizeInlineMarkdown(text)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function mapSectionName(sectionHeading) {
  // 把中文简历标题映射成稳定的业务 section key。
  // 后面写入 Milvus 后，这些 key 会非常适合做 filter、rerank、调试分析。
  const normalized = normalizeInlineMarkdown(sectionHeading);

  switch (normalized) {
    case '基本信息':
      return 'profile';
    case '核心竞争力':
      return 'core_strengths';
    case '教育经历':
      return 'education';
    case '专业技能':
      return 'skills';
    case '工作经历':
      return 'work_experience';
    case '核心项目经历':
      return 'projects';
    default:
      return slugify(normalized) || 'misc';
  }
}

function parseBasicInfoBlock(lines, sourceId) {
  // “基本信息”这一段和后面的章节结构不太一样：
  // 它混合了 1 级标题、markdown 表格、以及普通文本描述。
  // 所以单独拿出来解析，更容易得到干净的 profile_summary。
  let fullName = '';
  let tableLine = '';
  const plainLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      fullName = normalizeInlineMarkdown(trimmed.slice(2));
      continue;
    }

    if (trimmed.startsWith('|') && !trimmed.includes('---')) {
      tableLine = trimmed;
      continue;
    }

    if (!trimmed.startsWith('|')) {
      plainLines.push(normalizeInlineMarkdown(trimmed));
    }
  }

  const details = tableLine
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

  const contentParts = [];
  if (fullName) contentParts.push(`姓名：${fullName}`);
  if (details.length >= 5) {
    contentParts.push(
      `学历：${details[1]}；工作年限：${details[2]}；方向：${details[3]}；地点：${details[4]}`
    );
  }
  contentParts.push(...plainLines);

  return {
    // 基本信息在一份简历里天然只有 1 条，因此这里的 id 可以简单一些。
    id: 'resume:profile:profile_summary:basic_info',
    sourceId,
    locale: 'zh',
    section: 'profile',
    subsectionKey: 'basic_info',
    subsectionTitle: '基本信息',
    entityType: 'profile_summary',
    tags: ['简历', '基本信息', '个人简介'],
    content: contentParts.join('\n'),
  };
}

function createRecord(
  sourceId,
  section,
  subsectionKey,
  subsectionTitle,
  entityType,
  content,
  tags = []
) {
  // 这里是这次排查后很重要的修复点：
  // 不能只靠标题来生成 id，否则“同一小节下多个 bullet 共用一个标题”时会重复。
  //
  // 例如：
  // - “AI Agent 开发”下面有 5 条 bullet
  // - 如果只用标题生成 id，这 5 条会撞主键
  //
  // 所以这里额外拼一个 contentHash，保证：
  // - 人类可读：前面还能看出 section / subsection / 类型
  // - 稳定唯一：不同内容天然不同 id
  const contentHash = crypto
    .createHash('sha1')
    .update(`${sourceId}:${content.trim()}`)
    .digest('hex')
    .slice(0, 10);

  return {
    id: `resume:${section}:${entityType}:${contentHash}`,
    sourceId,
    locale: 'zh',
    section,
    subsectionKey,
    subsectionTitle: normalizeInlineMarkdown(subsectionTitle || subsectionKey || section),
    entityType,
    tags: [...new Set(tags)],
    content: content.trim(),
  };
}

function flushStructuredBlock(records, block, sourceId) {
  // flush 的意思是：
  // 当前手头已经积累完一个“结构块”了，现在把它正式转成 record。
  //
  // 比如：
  // - 当前 section = 专业技能
  // - 当前 subsection = AI Agent 开发
  // - 当前 bullets = 5 条技能点
  //
  // 那 flush 时就会产出 5 条 skill_item record。
  if (!block.section) return;

  const sectionKey = mapSectionName(block.section);
  const subsectionTitle = block.subheading
    ? normalizeInlineMarkdown(block.subheading)
    : normalizeInlineMarkdown(block.section);
  const subsectionKey = block.subheading ? slugify(subsectionTitle) || sectionKey : sectionKey;
  const tags = ['简历', normalizeInlineMarkdown(block.section)];

  if (block.section === '核心竞争力') {
    // 核心竞争力最适合“一条 bullet = 一条 record”
    // 因为用户问“有没有管理经验 / AI 工程化实践”时，希望直接命中具体条目。
    for (const bullet of block.bullets) {
      records.push(
        createRecord(
          sourceId,
          sectionKey,
          subsectionKey,
          subsectionTitle,
          'strength_item',
          normalizeInlineMarkdown(bullet),
          [...tags, '核心竞争力']
        )
      );
    }
    return;
  }

  if (block.section === '专业技能') {
    // 专业技能同理，每条 bullet 都是独立知识点。
    for (const bullet of block.bullets) {
      records.push(
        createRecord(
          sourceId,
          sectionKey,
          subsectionKey,
          subsectionTitle,
          'skill_item',
          normalizeInlineMarkdown(bullet),
          [...tags, '专业技能', subsectionTitle]
        )
      );
    }
    return;
  }

  if (block.section === '教育经历') {
    // 教育经历目前是“每个学校 / 教育节点一条 record”。
    // 后续如果教育部分变复杂，也可以继续细分出 degree / major / date。
    const content = [subsectionTitle, ...block.paragraphs].map(normalizeInlineMarkdown).join('\n');
    records.push(
      createRecord(
        sourceId,
        sectionKey,
        subsectionKey,
        subsectionTitle,
        'education_item',
        content,
        [...tags, '教育经历']
      )
    );
    return;
  }

  if (block.section === '工作经历' || block.section === '核心项目经历') {
    // 工作经历 / 项目经历更复杂，所以拆成两类：
    // 1. summary：整体介绍、角色、技术栈、概览
    // 2. detail：每一条亮点 / 成果 / 难点解决
    //
    // 这样的好处是：
    // - 问“做过什么项目”时，容易召回 summary
    // - 问“具体解决了什么问题”时，容易召回 detail
    const entityTag = block.section === '工作经历' ? '工作经历' : '项目经历';
    const kind = block.section === '工作经历' ? 'experience' : 'project';
    const title = subsectionTitle;

    const headerParts = [];
    if (block.fields['职位与类型']) headerParts.push(`职位与类型：${normalizeInlineMarkdown(block.fields['职位与类型'])}`);
    if (block.fields['角色']) headerParts.push(`角色：${normalizeInlineMarkdown(block.fields['角色'])}`);
    if (block.fields['项目概览']) headerParts.push(`项目概览：${normalizeInlineMarkdown(block.fields['项目概览'])}`);
    if (block.fields['工作概述']) headerParts.push(`工作概述：${normalizeInlineMarkdown(block.fields['工作概述'])}`);
    if (block.fields['项目核心功能']) {
      headerParts.push(`项目核心功能：${normalizeInlineMarkdown(block.fields['项目核心功能'])}`);
    }
    if (block.fields['技术栈']) headerParts.push(`技术栈：${normalizeInlineMarkdown(block.fields['技术栈'])}`);
    if (block.fields['相关链接']) headerParts.push(`相关链接：${normalizeInlineMarkdown(block.fields['相关链接'])}`);

    if (headerParts.length > 0) {
      // summary record 负责承载“全局视角”的信息。
      records.push(
        createRecord(
          sourceId,
          sectionKey,
          subsectionKey,
          title,
          `${kind}_summary`,
          headerParts.join('\n'),
          [...tags, entityTag, title]
        )
      );
    }

    const bulletField =
      block.fields['主要成果'] ||
      block.fields['亮点、难点与解决方案'] ||
      block.bullets.join('\n');

    const bulletLines = String(bulletField || '')
      .split('\n')
      .map((item) => normalizeInlineMarkdown(item.replace(/^-+\s*/, '')))
      .filter(Boolean);

    bulletLines.forEach((item, index) => {
      // 每条亮点单独做一条 record，后续检索会更细粒度。
      records.push(
        createRecord(
          sourceId,
          sectionKey,
          subsectionKey,
          title,
          `${kind}_detail_${index + 1}`,
          item,
          [...tags, entityTag, title]
        )
      );
    });
    return;
  }

  const content = [...block.paragraphs, ...block.bullets].map(normalizeInlineMarkdown).filter(Boolean).join('\n');
  if (content) {
    // 这里是兜底逻辑：前面没有专门适配的 section，至少也转成一条通用 record。
    records.push(
      createRecord(sourceId, sectionKey, subsectionKey, subsectionTitle, 'section_item', content, tags)
    );
  }
}

function parseStructuredBlocks(markdown, sourceId) {
  // 这是 markdown -> records 的主解析流程。
  // 思路不是做“完整 markdown AST 解析”，而是基于当前简历格式做一版够用、好理解的结构扫描。
  const lines = markdown.split(/\r?\n/);
  const records = [];
  let currentSection = '';
  let currentBlock = null;
  const basicInfoLines = [];

  function flushCurrentBlock() {
    // 每当 section / subsection 切换时，都要把上一个 block 收口。
    if (currentBlock) {
      flushStructuredBlock(records, currentBlock, sourceId);
      currentBlock = null;
    }
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('## ')) {
      // 遇到新的二级标题，说明进入了新的一级业务区块。
      if (currentSection === '基本信息' && basicInfoLines.length > 0) {
        records.push(parseBasicInfoBlock(basicInfoLines, sourceId));
        basicInfoLines.length = 0;
      }
      flushCurrentBlock();
      currentSection = normalizeInlineMarkdown(trimmed.slice(3));
      continue;
    }

    if (!currentSection) continue;

    if (currentSection === '基本信息') {
      // 基本信息先缓存，等离开该 section 时统一解析。
      basicInfoLines.push(rawLine);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      // 遇到三级标题，就开启一个新的 subsection block。
      flushCurrentBlock();
      currentBlock = {
        section: currentSection,
        subheading: normalizeInlineMarkdown(trimmed.slice(4)),
        paragraphs: [],
        bullets: [],
        fields: {},
        activeField: '',
      };
      continue;
    }

    if (!currentBlock) {
      // 某些 section 可能没有明确的 ### 小标题，这里给它一个默认 block。
      currentBlock = {
        section: currentSection,
        subheading: '',
        paragraphs: [],
        bullets: [],
        fields: {},
        activeField: '',
      };
    }

    if (!trimmed) {
      // 空行意味着当前 field 段落结束。
      currentBlock.activeField = '';
      continue;
    }

    const fieldMatch = trimmed.match(/^\*\*(.+?)：\*\*\s*(.*)$/);
    if (fieldMatch) {
      // 匹配这种格式：
      // **职位与类型：** 前端主管 · 医药合规 / SaaS / ToC
      //
      // 这样后续可以把“字段名 -> 字段值”结构化拿出来。
      const key = normalizeInlineMarkdown(fieldMatch[1]);
      const value = normalizeInlineMarkdown(fieldMatch[2]);
      currentBlock.fields[key] = value;
      currentBlock.activeField = key;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      // bullet 既要放到 bullets 列表里，
      // 如果当前正处在某个 field 下，也要顺便拼回 field 内容里。
      const bullet = normalizeInlineMarkdown(trimmed.slice(2));
      currentBlock.bullets.push(bullet);
      if (currentBlock.activeField) {
        currentBlock.fields[currentBlock.activeField] = [
          currentBlock.fields[currentBlock.activeField],
          `- ${bullet}`,
        ]
          .filter(Boolean)
          .join('\n');
      }
      continue;
    }

    if (currentBlock.activeField) {
      // 普通文本如果跟在某个字段后面，就认为它是该字段的续行。
      currentBlock.fields[currentBlock.activeField] = [
        currentBlock.fields[currentBlock.activeField],
        normalizeInlineMarkdown(trimmed),
      ]
        .filter(Boolean)
        .join('\n');
    } else {
      currentBlock.paragraphs.push(normalizeInlineMarkdown(trimmed));
    }
  }

  if (currentSection === '基本信息' && basicInfoLines.length > 0) {
    records.push(parseBasicInfoBlock(basicInfoLines, sourceId));
  }
  flushCurrentBlock();

  // 最后再过滤掉空内容，避免后续产生无意义向量。
  return records.filter((record) => record.content && record.content.trim().length > 0);
}

export async function loadResumeMarkdown(filePath = DEFAULT_RESUME_PATH) {
  // 这里只是纯读取文件，和解析逻辑分离，后面替换数据源会更容易。
  return fs.readFile(filePath, 'utf8');
}

export async function extractResumeRecords(filePath = DEFAULT_RESUME_PATH) {
  // extractResumeRecords = 读文件 + 解析结构，得到第一层语义 records。
  const markdown = await loadResumeMarkdown(filePath);
  const sourceId = path.basename(filePath, path.extname(filePath));
  return parseStructuredBlocks(markdown, sourceId);
}

export async function chunkResumeRecords(
  records,
  {
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
  } = {}
) {
  // 第二层处理：如果某条 record 太长，再做 chunk。
  //
  // 注意这里不是“对整份简历切块”，
  // 而是对已经结构化好的 record 做二次切块，这样语义边界更自然。
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', '。', '；', '，', ' '],
  });

  const chunks = [];

  for (const record of records) {
    if (record.content.length <= chunkSize) {
      // 大部分简历字段其实不长，直接保留 1:1 关系即可。
      chunks.push({
        ...record,
        chunkIndex: 0,
        chunkCount: 1,
      });
      continue;
    }

    const splitContents = await splitter.splitText(record.content);
    splitContents.forEach((content, index) => {
      // 只有真的被切开的 record，才会获得 :chunk:x 后缀。
      chunks.push({
        ...record,
        id: `${record.id}:chunk:${index}`,
        content,
        chunkIndex: index,
        chunkCount: splitContents.length,
      });
    });
  }

  return chunks;
}

export async function buildResumeChunkPlan(filePath = DEFAULT_RESUME_PATH, options = {}) {
  // 这是外部最常用的统一入口：
  // 调一次，就能拿到 filePath / records / chunks / 数量统计。
  const records = await extractResumeRecords(filePath);
  const chunks = await chunkResumeRecords(records, options);

  return {
    filePath,
    recordCount: records.length,
    chunkCount: chunks.length,
    records,
    chunks,
  };
}

export function resolveCurrentDir(importMetaUrl) {
  // 小工具函数，方便某些脚本需要拿到当前模块目录时复用。
  return path.dirname(fileURLToPath(importMetaUrl));
}
