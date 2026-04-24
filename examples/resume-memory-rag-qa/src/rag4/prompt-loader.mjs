import fs from 'node:fs/promises';
import path from 'node:path';

// 版本 4 开始，Prompt 不再硬编码在 JS 里，
// 而是统一放到 prompts 目录管理。
//
// 这样有几个好处：
// - prompt 内容和程序逻辑分离
// - 更方便修改和对照
// - 新增模板时，不需要一直往 JS 文件里塞大段字符串
const PROMPTS_DIR = path.resolve(
  process.cwd(),
  'examples/resume-memory-rag-qa/src/rag4/prompts'
);

function renderTemplate(template, variables) {
  // 一个非常轻量的模板渲染器：
  // 把 {{question}}、{{context}}、{{history}} 这样的占位符替换成真实内容。
  //
  // 当前刻意不引入 ejs / handlebars 之类库，
  // 因为 demo 阶段只需要最简单的插值能力。
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => String(variables[key] ?? ''));
}

export async function loadPromptTemplate(templateName) {
  // 读取指定模板文件，例如：
  // resume_experience_qa -> prompts/resume_experience_qa.md
  const filePath = path.join(PROMPTS_DIR, `${templateName}.md`);
  return fs.readFile(filePath, 'utf8');
}

export async function buildPrompt(templateName, variables) {
  // 构建 prompt = 读取模板 + 注入变量
  const template = await loadPromptTemplate(templateName);
  return renderTemplate(template, variables);
}

export function getTemplateByStrategy(strategy, explicitTemplate = '') {
  // 模板选择优先级：
  // 1. 如果调用方显式传了 template，就尊重调用方
  // 2. 否则根据问题 strategy 自动选一个默认模板
  if (explicitTemplate) {
    return explicitTemplate;
  }

  if (strategy === 'experience') return 'resume_experience_qa';
  if (strategy === 'project') return 'resume_experience_qa';
  if (strategy === 'skill') return 'skill_eval';
  return 'resume_qa';
}

export function formatHistory(history = []) {
  // 把历史消息转换成 prompt 中可读的文本块。
  //
  // 这里没有直接把 JSON 塞进 prompt，
  // 而是转成“第 N 轮 user / assistant：...”的纯文本，
  // 目的是让模型更自然地理解上下文。
  if (!Array.isArray(history) || history.length === 0) {
    return '无';
  }

  return history
    .map((item, index) => `第 ${index + 1} 轮 ${item.role || 'user'}：${String(item.content || '').trim()}`)
    .join('\n');
}
