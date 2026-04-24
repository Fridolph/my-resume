import { buildMessages, getTemplateByStrategy } from './prompt-builder-v5.mjs';
import { buildRAGContext } from './context-builder.mjs';

export async function runRAGv5({
  client,
  model,
  collectionName,
  question,
  history = [],
  topK = 8,
  candidateTopK = Math.max(topK * 2, 10),
  filter = '',
  outputFields,
  strategy = '',
  promptTemplate = '',
}) {
  // 版本 5 明确拆成两层：
  //
  // 1. buildRAGContext()
  //    只负责准备证据，不负责生成
  //
  // 2. runRAGv5()
  //    负责选择模板、构建 messages、调用模型
  const ragContext = await buildRAGContext({
    client,
    collectionName,
    question,
    topK,
    candidateTopK,
    filter,
    outputFields,
    strategy,
  });

  const resolvedTemplate = await getTemplateByStrategy(ragContext.strategy, promptTemplate);
  const messages = await buildMessages(resolvedTemplate, {
    context: ragContext.context,
    question,
    history,
  });

  const response = await model.invoke(messages);

  return {
    ...ragContext,
    promptTemplate: resolvedTemplate,
    messages,
    answer: response.content,
  };
}
