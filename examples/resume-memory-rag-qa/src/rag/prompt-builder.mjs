function formatHistory(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return '无';
  }

  return history
    .map((item, index) => `第 ${index + 1} 轮 ${item.role || 'user'}：${String(item.content || '').trim()}`)
    .join('\n');
}

export const PROMPT_TEMPLATES = {
  resume_qa: ({ context, question, history }) => `你是一个简历问答助手。请只基于给定的简历片段回答问题，不要脑补。

历史对话：
${formatHistory(history)}

如果片段证据不足：
1. 请明确说“当前检索到的简历片段不足以确认这个问题”；
2. 但如果已有部分相关证据，也可以给出“有限结论 + 不足说明”；
3. 回答时尽量指出信息来自哪些 section。

简历片段：
${context}

问题：${question}

回答要求：
1. 先给结论；
2. 再列出最关键的事实依据；
3. 语言尽量简洁。

回答：`,

  resume_experience_qa: ({ context, question, history }) => `你是一个简历问答助手。请只基于给定的简历片段回答问题，不要脑补。

你现在处理的是“经验 / 经历类”问题。
回答时请遵守以下优先级：
1. 优先引用 projects 和 work_experience；
2. 如果 skills 或 core_strengths 能补充背景，可以补充，但不能喧宾夺主；
3. 如果项目或工作经历中证据不足，再明确说明不足。

历史对话：
${formatHistory(history)}

简历片段：
${context}

问题：${question}

回答要求：
1. 先给结论；
2. 优先总结最能代表候选人的项目 / 工作经历；
3. 再补充技能或核心竞争力；
4. 如果证据还不够完整，要明确写出“目前更像是部分佐证，而非完整结论”。

回答：`,

  skill_eval: ({ context, question, history }) => `你是一个简历技能评估助手。请只基于给定片段进行判断，不要脑补。

历史对话：
${formatHistory(history)}

简历片段：
${context}

问题：${question}

回答要求：
1. 先给总体判断；
2. 再说明依据来自哪些技能、项目或工作经历；
3. 如果证据不足，要直接说明。

评估：`,

  job_match: ({ context, question, history }) => `你是一个岗位匹配助手。请只基于给定片段分析候选人与岗位的匹配度。

历史对话：
${formatHistory(history)}

简历片段：
${context}

岗位要求 / 问题：
${question}

回答要求：
1. 先给匹配结论；
2. 分别说明匹配点和可能不足；
3. 明确指出依据来自哪些片段。

匹配分析：`,
};

export function buildPrompt(templateName, payload) {
  const template = PROMPT_TEMPLATES[templateName];

  if (!template) {
    throw new Error(`未知 prompt 模板: ${templateName}`);
  }

  return template(payload);
}

export function getTemplateByStrategy(strategy, preferredTemplate = '') {
  if (preferredTemplate) {
    return preferredTemplate;
  }

  if (strategy === 'experience') return 'resume_experience_qa';
  if (strategy === 'project') return 'resume_experience_qa';
  if (strategy === 'skill') return 'skill_eval';
  return 'resume_qa';
}
