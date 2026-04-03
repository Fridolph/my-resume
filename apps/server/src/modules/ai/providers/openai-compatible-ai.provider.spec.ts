import { describe, expect, it, vi } from 'vitest';

import { OpenAiCompatibleAiProvider } from './openai-compatible-ai.provider';

describe('OpenAiCompatibleAiProvider', () => {
  it('should call the chat completions endpoint with unified payload', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'chatcmpl-demo',
        choices: [
          {
            message: {
              content: '这是七牛云兼容接口返回的分析内容',
            },
          },
        ],
      }),
    } as Response);

    const provider = new OpenAiCompatibleAiProvider(
      {
        provider: 'qiniu',
        mode: 'openai-compatible',
        apiKey: 'sk-qiniu-demo',
        baseUrl: 'https://api.qnaigc.com/v1',
        model: 'deepseek-v3',
        providerLabel: 'Qiniu AI',
      },
      fetchMock,
    );

    const result = await provider.generateText({
      systemPrompt: '你是一名简历顾问',
      prompt: '请用中文给出三条优化建议',
      temperature: 0.2,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.qnaigc.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-qiniu-demo',
        }),
      }),
    );
    expect(result.provider).toBe('qiniu');
    expect(result.model).toBe('deepseek-v3');
    expect(result.text).toBe('这是七牛云兼容接口返回的分析内容');
  });

  it('should call the embeddings endpoint with unified payload', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            index: 0,
            embedding: [0.1, 0.2, 0.3],
          },
          {
            index: 1,
            embedding: [0.3, 0.2, 0.1],
          },
        ],
      }),
    } as Response);

    const provider = new OpenAiCompatibleAiProvider(
      {
        provider: 'qiniu',
        mode: 'openai-compatible',
        apiKey: 'sk-qiniu-demo',
        baseUrl: 'https://api.qnaigc.com/v1',
        model: 'deepseek-v3',
        providerLabel: 'Qiniu AI',
      },
      fetchMock,
    );

    const result = await provider.embedTexts({
      texts: ['Vue3 TypeScript', 'NestJS RAG'],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.qnaigc.com/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-qiniu-demo',
        }),
      }),
    );
    expect(result.embeddings).toEqual([
      [0.1, 0.2, 0.3],
      [0.3, 0.2, 0.1],
    ]);
  });
});
