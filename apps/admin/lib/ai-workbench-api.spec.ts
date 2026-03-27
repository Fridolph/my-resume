import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAiWorkbenchRuntime } from './ai-workbench-api';

describe('ai workbench api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch ai runtime summary with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          provider: 'qiniu',
          model: 'deepseek-v3',
          mode: 'live',
          supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'],
        }),
      }),
    );

    const response = await fetchAiWorkbenchRuntime({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/ai/reports/runtime',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer demo-token',
        },
      }),
    );
    expect(response.provider).toBe('qiniu');
    expect(response.model).toBe('deepseek-v3');
    expect(response.supportedScenarios).toContain('jd-match');
  });
});
