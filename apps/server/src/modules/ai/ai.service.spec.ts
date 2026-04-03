import { describe, expect, it, vi } from 'vitest';

import { AiService } from './ai.service';
import { createAiProvider } from './providers/ai-provider.factory';

describe('AiService', () => {
  it('should expose the current provider summary through the unified service', async () => {
    const provider = createAiProvider(
      {
        provider: 'mock',
        mode: 'mock',
        model: 'mock-resume-advisor',
      },
      vi.fn<typeof fetch>(),
    );
    const aiService = new AiService(provider);

    expect(aiService.getProviderSummary()).toEqual({
      provider: 'mock',
      model: 'mock-resume-advisor',
      mode: 'mock',
    });
  });

  it('should call the current provider via the unified service entry', async () => {
    const provider = createAiProvider(
      {
        provider: 'mock',
        mode: 'mock',
        model: 'mock-resume-advisor',
      },
      vi.fn<typeof fetch>(),
    );
    const aiService = new AiService(provider);

    const result = await aiService.generateText({
      prompt: '请生成一个简历优化建议摘要',
    });

    expect(result.text).toContain('简历优化建议摘要');
  });

  it('should expose embeddings through the unified service entry', async () => {
    const provider = createAiProvider(
      {
        provider: 'mock',
        mode: 'mock',
        model: 'mock-resume-advisor',
      },
      vi.fn<typeof fetch>(),
    );
    const aiService = new AiService(provider);

    const result = await aiService.embedTexts({
      texts: ['Vue3 与 TypeScript', 'EDR 安全平台'],
    });

    expect(result.embeddings).toHaveLength(2);
    expect(result.embeddings[0].length).toBeGreaterThan(0);
  });
});
