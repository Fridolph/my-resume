import { beforeEach, describe, expect, it, vi } from 'vitest';

import { extractTextFromFile } from '../ai-file-api';

describe('ai file api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should upload a file to the NestJS extraction endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          fileName: 'resume.md',
          fileType: 'md',
          mimeType: 'text/markdown',
          text: '# Resume',
          charCount: 8,
        }),
      }),
    );

    const file = new File(['# Resume'], 'resume.md', {
      type: 'text/markdown',
    });

    const result = await extractTextFromFile({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      file,
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/ai/extract-text',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo-token',
        },
        body: expect.any(FormData),
      }),
    );
    expect(result.fileType).toBe('md');
    expect(result.text).toContain('Resume');
  });

  it('should surface server extraction errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: 'Unsupported file type: csv',
        }),
      }),
    );

    const file = new File(['a,b,c'], 'resume.csv', {
      type: 'text/csv',
    });

    await expect(
      extractTextFromFile({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
        file,
      }),
    ).rejects.toThrow('Unsupported file type: csv');
  });
});
