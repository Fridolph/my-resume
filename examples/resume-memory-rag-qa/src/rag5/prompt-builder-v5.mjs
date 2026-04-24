import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(CURRENT_DIR, 'prompts');
const STRATEGY_TEMPLATE_MAP_PATH = path.join(CURRENT_DIR, 'config', 'strategy-template-map.json');

let strategyTemplateMapCache = null;

function renderTemplate(template, variables) {
  // 轻量模板渲染器：
  // 把 {{context}} 这类占位符替换成真实值。
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => String(variables[key] ?? ''));
}

async function loadStrategyTemplateMap() {
  if (strategyTemplateMapCache) {
    return strategyTemplateMapCache;
  }

  const raw = await fs.readFile(STRATEGY_TEMPLATE_MAP_PATH, 'utf8');
  strategyTemplateMapCache = JSON.parse(raw);
  return strategyTemplateMapCache;
}

export async function loadPromptTemplate(templateName) {
  const filePath = path.join(PROMPTS_DIR, `${templateName}.md`);
  return fs.readFile(filePath, 'utf8');
}

export async function getTemplateByStrategy(strategy, preferredTemplate = '') {
  if (preferredTemplate) {
    return preferredTemplate;
  }

  const strategyTemplateMap = await loadStrategyTemplateMap();
  return strategyTemplateMap[strategy] ?? 'resume_qa';
}

export function validatePromptPayload(payload = {}) {
  if (!payload?.question) {
    throw new Error('[prompt-builder-v5] question 是必填项');
  }

  if (!payload?.context) {
    console.warn('[prompt-builder-v5] context 为空，召回结果可能为空。');
  }
}

export async function buildSystemPrompt(templateName, variables) {
  const template = await loadPromptTemplate(templateName);
  return renderTemplate(template, variables);
}

export function historyToMessages(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  return history.map((item) => {
    const content = String(item?.content ?? '').trim();
    const role = String(item?.role ?? 'user').trim();

    if (role === 'assistant') {
      return new AIMessage(content);
    }

    return new HumanMessage(content);
  });
}

export async function buildMessages(templateName, payload) {
  // 版本 5 开始，Prompt 不再是“一个拼好的大字符串”直接喂给模型，
  // 而是：
  // - SystemMessage：放规则和召回上下文
  // - History Messages：放历史对话
  // - HumanMessage：放当前问题
  //
  // 这样更贴近 Chat 模型原生接口，也更适合多轮对话。
  validatePromptPayload(payload);

  const systemPrompt = await buildSystemPrompt(templateName, {
    context: payload.context,
  });

  return [
    new SystemMessage(systemPrompt),
    ...historyToMessages(payload.history),
    new HumanMessage(payload.question),
  ];
}
