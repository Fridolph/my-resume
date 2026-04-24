import fs from 'node:fs/promises';
import path from 'node:path';

// 版本 4 先不把对话历史写进 Milvus，
// 而是先落到本地运行时目录：
// examples/resume-memory-rag-qa/.runtime/chat-sessions
//
// 这样更符合当前 demo 阶段的特点：
// - 简单
// - 可读
// - 易调试
// - 不会污染简历知识库 collection
export const DEFAULT_HISTORY_DIR = path.resolve(
  process.cwd(),
  'examples/resume-memory-rag-qa/.runtime/chat-sessions'
);

async function ensureDir(dirPath) {
  // recursive=true 表示目录不存在时自动级联创建。
  await fs.mkdir(dirPath, { recursive: true });
}

function sanitizeSessionId(sessionId) {
  // sessionId 最终会被拿来当文件名，所以要做一次清洗：
  // - 去掉首尾空白
  // - 把不安全字符替换成 "-"
  // - 如果清洗后为空，就回退成 default
  return String(sessionId || 'default')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'default';
}

function getSessionFilePath(sessionId, historyDir = DEFAULT_HISTORY_DIR) {
  // 一个 session 对应一个 JSON 文件。
  const safeSessionId = sanitizeSessionId(sessionId);
  return path.join(historyDir, `${safeSessionId}.json`);
}

export async function loadSession(sessionId, historyDir = DEFAULT_HISTORY_DIR) {
  // 加载 session 的逻辑是：
  // 1. 先保证目录存在
  // 2. 尝试读对应 JSON 文件
  // 3. 如果文件不存在，返回一个“空 session”
  await ensureDir(historyDir);
  const filePath = getSessionFilePath(sessionId, historyDir);

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      sessionId: sanitizeSessionId(parsed.sessionId || sessionId),
      filePath,
      turns: Array.isArray(parsed.turns) ? parsed.turns : [],
    };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // 只有“文件不存在”才是正常情况；
      // 其他错误（例如 JSON 损坏、权限异常）都应该向上抛出。
      throw error;
    }

    return {
      sessionId: sanitizeSessionId(sessionId),
      filePath,
      turns: [],
    };
  }
}

export function sessionToPromptHistory(session, maxTurns = 3) {
  // 这个函数把“本地 session turns”转换成 prompt 需要的历史消息结构。
  //
  // turns 原始结构更偏“存储视角”：
  // [{ question, answer, ...meta }]
  //
  // prompt history 更偏“对话视角”：
  // [
  //   { role: 'user', content: question },
  //   { role: 'assistant', content: answer }
  // ]
  //
  // 这里只取最近 maxTurns 轮，避免上下文无限增长。
  const turns = Array.isArray(session?.turns) ? session.turns.slice(-maxTurns) : [];

  return turns.flatMap((turn) => [
    {
      role: 'user',
      content: turn.question,
    },
    {
      role: 'assistant',
      content: turn.answer,
    },
  ]);
}

export async function appendSessionTurn(
  sessionId,
  turn,
  {
    historyDir = DEFAULT_HISTORY_DIR,
    maxStoredTurns = 20,
  } = {}
) {
  // append 的思路是：
  // 1. 先把旧 session 读出来
  // 2. 构造本轮 turn
  // 3. 追加到末尾
  // 4. 只保留最近 maxStoredTurns 轮
  // 5. 覆盖写回文件
  const session = await loadSession(sessionId, historyDir);
  const nextTurn = {
    // createdAt 方便后续排查“哪一轮是什么时候问的”。
    createdAt: new Date().toISOString(),
    question: String(turn.question || '').trim(),
    answer: String(turn.answer || '').trim(),
    strategy: String(turn.strategy || '').trim(),
    promptTemplate: String(turn.promptTemplate || '').trim(),
    finalMatchCount: Number(turn.finalMatchCount || 0),
  };

  const turns = [...session.turns, nextTurn].slice(-maxStoredTurns);
  const payload = {
    sessionId: session.sessionId,
    turns,
  };

  // 以 JSON pretty-print 的形式写入，方便直接打开文件学习和调试。
  await ensureDir(historyDir);
  await fs.writeFile(session.filePath, JSON.stringify(payload, null, 2), 'utf8');

  return {
    ...session,
    turns,
  };
}

export async function resetSession(sessionId, historyDir = DEFAULT_HISTORY_DIR) {
  // reset 本质上就是删除对应 session 文件。
  const session = await loadSession(sessionId, historyDir);

  try {
    await fs.unlink(session.filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}
