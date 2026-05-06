/**
 * 构造“只修 JSON 语法”的二次修复 Prompt。
 */
export function buildResumeImportJsonRepairPrompt(input: {
  jsonText: string
  parseError: string
}): string {
  return [
    '下面是一段 AI 简历识别结果 JSON，但它存在语法错误。',
    '请只修复 JSON 语法，不要改写字段语义，不要新增解释，不要输出 Markdown。',
    '输出必须是一个合法 JSON object，且保留 resume / summary / warnings 等原字段。',
    '',
    `解析错误：${input.parseError}`,
    '',
    '待修复 JSON：',
    input.jsonText,
  ].join('\n')
}
