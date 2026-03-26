import { describe, expect, it } from 'vitest';

import { MockAiProvider } from './mock-ai.provider';

describe('MockAiProvider', () => {
  it('should return stable fake analysis content for teaching mode', async () => {
    const provider = new MockAiProvider({
      provider: 'mock',
      mode: 'mock',
      model: 'mock-resume-advisor',
    });

    const result = await provider.generateText({
      prompt: '请分析这份简历与 JD 的匹配度',
      systemPrompt: '你是一名简历顾问',
    });

    expect(result.provider).toBe('mock');
    expect(result.model).toBe('mock-resume-advisor');
    expect(result.text).toContain('Mock AI response');
    expect(result.text).toContain('请分析这份简历与 JD 的匹配度');
  });
});
