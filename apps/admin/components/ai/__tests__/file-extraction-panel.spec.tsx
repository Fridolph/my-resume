'use client';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiFileExtractionPanel } from '../file-extraction-panel';

afterEach(() => {
  cleanup();
});

describe('AiFileExtractionPanel', () => {
  it('should show read-only message when current role cannot upload', () => {
    render(
      <AiFileExtractionPanel
        accessToken="demo-token"
        apiBaseUrl="http://localhost:5577"
        canUpload={false}
      />,
    );

    expect(screen.getByText('当前角色只读')).toBeInTheDocument();
    expect(
      screen.getByText(
        'viewer 当前只保留缓存结果与预设体验，文件上传入口会在管理员链路中继续推进。',
      ),
    ).toBeInTheDocument();
  });

  it('should upload a file and render extracted preview for admin', async () => {
    const user = userEvent.setup();
    const onExtractedText = vi.fn();
    const extractFileText = vi.fn().mockResolvedValue({
      fileName: 'resume.txt',
      fileType: 'txt',
      mimeType: 'text/plain',
      text: 'resume text content',
      charCount: 19,
    });

    render(
      <AiFileExtractionPanel
        accessToken="demo-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        extractFileText={extractFileText}
        onExtractedText={onExtractedText}
      />,
    );

    const file = new File(['resume text content'], 'resume.txt', {
      type: 'text/plain',
    });

    await user.upload(screen.getByLabelText('选择文件'), file);
    await user.click(screen.getByRole('button', { name: '开始提取文本' }));

    await waitFor(() => {
      expect(extractFileText).toHaveBeenCalledWith({
        accessToken: 'demo-token',
        apiBaseUrl: 'http://localhost:5577',
        file,
      });
    });

    expect(await screen.findByDisplayValue('resume text content')).toBeInTheDocument();
    expect(screen.getByText('txt')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
    expect(onExtractedText).toHaveBeenCalledWith({
      fileName: 'resume.txt',
      fileType: 'txt',
      mimeType: 'text/plain',
      text: 'resume text content',
      charCount: 19,
    });
  });

  it('should show extraction error feedback when upload fails', async () => {
    const user = userEvent.setup();
    const extractFileText = vi
      .fn()
      .mockRejectedValue(new Error('PDF 解析失败，请稍后重试'));

    render(
      <AiFileExtractionPanel
        accessToken="demo-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        extractFileText={extractFileText}
      />,
    );

    const file = new File(['%PDF-1.7'], 'resume.pdf', {
      type: 'application/pdf',
    });

    await user.upload(screen.getByLabelText('选择文件'), file);
    await user.click(screen.getByRole('button', { name: '开始提取文本' }));

    expect(
      await screen.findByText('PDF 解析失败，请稍后重试'),
    ).toBeInTheDocument();
  });
});
