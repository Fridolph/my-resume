import { describe, expect, it, vi } from 'vitest'

import { OpenAiCompatibleAiProvider } from '../openai-compatible-ai.provider'

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
    } as Response)

    const provider = new OpenAiCompatibleAiProvider(
      {
        provider: 'qiniu',
        mode: 'openai-compatible',
        apiKey: 'sk-qiniu-demo',
        baseUrl: 'https://api.qnaigc.com/v1',
        model: 'deepseek-v3',
        chatModel: 'deepseek-v3',
        embeddingModel: 'text-embedding-v1',
        providerLabel: 'Qiniu AI',
      },
      fetchMock,
    )

    const result = await provider.generateText({
      systemPrompt: '你是一名简历顾问',
      prompt: '请用中文给出三条优化建议',
      temperature: 0.2,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.qnaigc.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-qiniu-demo',
        }),
        body: expect.stringContaining('"model":"deepseek-v3"'),
      }),
    )
    expect(result.provider).toBe('qiniu')
    expect(result.model).toBe('deepseek-v3')
    expect(result.text).toBe('这是七牛云兼容接口返回的分析内容')
  })

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
    } as Response)

    const provider = new OpenAiCompatibleAiProvider(
      {
        provider: 'qiniu',
        mode: 'openai-compatible',
        apiKey: 'sk-qiniu-demo',
        baseUrl: 'https://api.qnaigc.com/v1',
        model: 'deepseek-v3',
        chatModel: 'deepseek-v3',
        embeddingModel: 'text-embedding-v1',
        providerLabel: 'Qiniu AI',
      },
      fetchMock,
    )

    const result = await provider.embedTexts({
      texts: ['Vue3 TypeScript', 'NestJS RAG'],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.qnaigc.com/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-qiniu-demo',
        }),
        body: expect.stringContaining('"model":"text-embedding-v1"'),
      }),
    )
    expect(result.embeddings).toEqual([
      [0.1, 0.2, 0.3],
      [0.3, 0.2, 0.1],
    ])
    expect(provider.getSummary()).toEqual({
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'openai-compatible',
      chatModel: 'deepseek-v3',
      embeddingModel: 'text-embedding-v1',
    })
  })

  it('should send deepseek v4 json and reasoning options when configured', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"summary":"ok","resume":{}}',
            },
          },
        ],
      }),
    } as Response)

    const provider = new OpenAiCompatibleAiProvider(
      {
        provider: 'deepseek',
        mode: 'openai-compatible',
        apiKey: 'sk-deepseek-demo',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-pro',
        chatModel: 'deepseek-v4-pro',
        embeddingModel: 'deepseek-v4-pro',
        maxTokens: 8192,
        providerLabel: 'DeepSeek',
        reasoningEffort: 'high',
        thinkingEnabled: true,
      },
      fetchMock,
    )

    await provider.generateText({
      prompt: '请输出 JSON',
      responseFormat: {
        type: 'json_object',
      },
    })

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(requestInit.body))).toEqual(
      expect.objectContaining({
        model: 'deepseek-v4-pro',
        max_tokens: 8192,
        reasoning_effort: 'high',
        response_format: {
          type: 'json_object',
        },
        thinking: {
          type: 'enabled',
        },
      }),
    )
  })

  it('should include provider error body when chat completions fails', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"Authentication Fails"}}',
    } as Response)

    const provider = new OpenAiCompatibleAiProvider(
      {
        provider: 'deepseek',
        mode: 'openai-compatible',
        apiKey: 'sk-deepseek-demo',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-flash',
        chatModel: 'deepseek-v4-flash',
        embeddingModel: 'deepseek-v4-flash',
        providerLabel: 'DeepSeek',
      },
      fetchMock,
    )

    await expect(
      provider.generateText({
        prompt: '请识别简历',
      }),
    ).rejects.toThrow(
      'DeepSeek chat completions request failed with status 401: {"error":{"message":"Authentication Fails"}}',
    )
  })
})
