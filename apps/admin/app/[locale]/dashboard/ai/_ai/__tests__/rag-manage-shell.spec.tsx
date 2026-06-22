import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { useAdminSessionMock } = vi.hoisted(() => ({
  useAdminSessionMock: vi.fn(),
}))

vi.mock('@core/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('../components/user-doc-ingestion-panel', () => ({
  AiUserDocIngestionPanel: () => <div data-testid="mock-ingestion-panel">mock ingestion</div>,
}))

import { RagManageShell } from '../rag-manage-shell'

async function selectHeroUiOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  optionText: string,
) {
  const trigger = screen.getByLabelText(label)
  await user.click(trigger)
  await user.click(screen.getByRole('option', { name: optionText }))
  await waitFor(() => {
    expect(trigger).toHaveTextContent(optionText)
  })
}

describe('RagManageShell', () => {
  beforeEach(() => {
    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: {
        id: 'admin-demo-user',
        username: 'admin',
        role: 'admin',
        isActive: true,
        capabilities: {
          canTriggerAiAnalysis: true,
        },
      },
      status: 'ready',
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows edit action only for editable docs and updates custom detail', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith('/api/ai/rag/documents') && (!init?.method || init.method === 'GET')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'user-doc:custom:und',
                title: 'Dao 核心原理',
                contentType: 'tech_blog',
                sourceScope: 'published',
                preview: '核心原理摘要',
                editable: true,
                createdAt: '2026-06-12T08:00:00.000Z',
                updatedAt: '2026-06-12T08:30:00.000Z',
              },
              {
                id: 'user-doc:file:und',
                title: '上传文件',
                contentType: 'general',
                sourceScope: 'published',
                preview: '上传内容',
                editable: false,
                createdAt: '2026-06-12T08:00:00.000Z',
                updatedAt: '2026-06-12T08:30:00.000Z',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.endsWith('/api/ai/rag/documents/user-doc:custom:und')) {
        return new Response(
          JSON.stringify({
            data: {
              id: 'user-doc:custom:und',
              title: 'Dao 核心原理',
              sourceType: 'user_docs',
              sourceScope: 'published',
              locale: 'und',
              contentType: 'tech_blog',
              content: '# Dao\n\n原始内容',
              linkUrl: 'https://example.com/dao',
              linkUrls: ['https://example.com/dao'],
              imageUrls: ['https://example.com/dao.png'],
              summary: '旧版 Dao 技术博客概览',
              preview: '# Dao',
              chunkCount: 1,
              editable: true,
              createdAt: '2026-06-12T08:00:00.000Z',
              updatedAt: '2026-06-12T08:30:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.endsWith('/api/ai/rag/custom/user-doc:custom:und') && init?.method === 'PUT') {
        return new Response(
          JSON.stringify({
            data: {
              updated: true,
              documentId: 'user-doc:custom:und',
              chunkCount: 2,
              vectorStoreBackend: 'milvus',
              vectorStoreSynced: true,
              vectorStoreWarning: null,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.endsWith('/api/ai/rag/index/rebuild') || url.endsWith('/api/ai/rag/user-docs/reconcile')) {
        return new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      throw new Error(`Unhandled fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<RagManageShell locale="zh" />)

    await user.click(screen.getByRole('tab', { name: '已入库管理' }))

    expect(await screen.findByText('Dao 核心原理')).toBeInTheDocument()
    expect(screen.getByText('上传文件')).toBeInTheDocument()
    expect(screen.getAllByText('可编辑')).toHaveLength(1)
    expect(screen.getByLabelText('编辑资料')).toBeInTheDocument()

    await user.click(screen.getByLabelText('编辑资料'))

    expect(await screen.findByDisplayValue('Dao 核心原理')).toBeInTheDocument()
    const contentField = screen.getByPlaceholderText('输入资料正文内容，支持 Markdown 格式...')
    expect(contentField).toHaveValue('# Dao\n\n原始内容')
    expect(screen.getByDisplayValue('旧版 Dao 技术博客概览')).toBeInTheDocument()

    await user.clear(screen.getByDisplayValue('Dao 核心原理'))
    await user.type(screen.getByPlaceholderText('请输入资料标题'), 'Dao 核心原理 v2')
    await user.clear(contentField)
    await user.type(contentField, '# Dao\n\n更新后的内容')
    await user.clear(screen.getByDisplayValue('旧版 Dao 技术博客概览'))
    await user.type(
      screen.getByPlaceholderText('若不填写，系统会根据正文自动生成 3 句话内简介...'),
      '更新后的 Dao 技术博客概览',
    )
    expect(screen.getByLabelText('编辑内容类型')).toBeInTheDocument()
    const contentTypeGrid = screen.getByLabelText('编辑内容类型').querySelector('.sm\\:grid-cols-4')
    expect(contentTypeGrid).not.toBeNull()

    const deleteLinkButton = screen.getByRole('button', { name: '参考链接 1' })
    await user.click(deleteLinkButton)
    await user.click(screen.getByRole('button', { name: '删除' }))
    await user.click(screen.getAllByRole('button', { name: '添加一项' })[0]!)
    const linkCardInput = screen.getByLabelText('参考链接 1 地址')
    await user.type(linkCardInput, 'https://example.com/dao-v2')

    await user.click(screen.getAllByRole('button', { name: '添加一项' })[0]!)
    const secondLinkInput = screen.getByLabelText('参考链接 2 地址')
    await user.type(secondLinkInput, 'https://example.com/dao-v3')

    await user.click(screen.getByRole('button', { name: '上移参考链接 2' }))

    const deleteImageButton = screen.getByRole('button', { name: '参考图片 1' })
    await user.click(deleteImageButton)
    await user.click(screen.getByRole('button', { name: '删除' }))
    await user.click(screen.getAllByRole('button', { name: '添加一项' })[1]!)
    const imageCardInput = screen.getByLabelText('参考图片 1 地址')
    await user.type(imageCardInput, 'https://example.com/dao-v2.png')

    await user.click(screen.getAllByRole('button', { name: '添加一项' })[1]!)
    const secondImageInput = screen.getByLabelText('参考图片 2 地址')
    await user.type(secondImageInput, 'https://example.com/dao-v3.png')

    await user.click(screen.getByRole('button', { name: '上移参考图片 2' }))
    await user.click(screen.getByRole('button', { name: '保存修改' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5577/api/ai/rag/custom/user-doc:custom:und',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer admin-token',
          }),
          body: JSON.stringify({
            title: 'Dao 核心原理 v2',
            content: '# Dao\n\n更新后的内容',
            contentType: 'tech_blog',
            linkUrls: ['https://example.com/dao-v3', 'https://example.com/dao-v2'],
            imageUrls: ['https://example.com/dao-v3.png', 'https://example.com/dao-v2.png'],
            summary: '更新后的 Dao 技术博客概览',
            scope: 'published',
          }),
        }),
      )
    })

    expect(await screen.findByText('资料已更新，RAG 检索内容已同步重建。')).toBeInTheDocument()
  }, 10000)

  it('supports pagination and page size switching for rag documents', async () => {
    const user = userEvent.setup()
    const pageOneDocuments = Array.from({ length: 6 }, (_, index) => ({
      id: `user-doc:${index + 1}:und`,
      title: `资料 ${index + 1}`,
      contentType: index % 2 === 0 ? 'tech_blog' : 'general',
      sourceScope: 'published',
      preview: `预览 ${index + 1}`,
      editable: index < 4,
      createdAt: `2026-06-1${index}T08:00:00.000Z`,
      updatedAt: `2026-06-1${index}T08:30:00.000Z`,
    }))

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith('/api/ai/rag/documents') && (!init?.method || init.method === 'GET')) {
        return new Response(
          JSON.stringify({ data: pageOneDocuments }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.endsWith('/api/ai/rag/index/rebuild') || url.endsWith('/api/ai/rag/user-docs/reconcile')) {
        return new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      throw new Error(`Unhandled fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<RagManageShell locale="zh" />)

    await user.click(screen.getByRole('tab', { name: '已入库管理' }))

    expect(await screen.findByText('资料 1')).toBeInTheDocument()
    expect(screen.getByText('资料 6')).toBeInTheDocument()
    expect(screen.getByTestId('rag-documents-pagination-summary')).toHaveTextContent(
      '显示 1-6 / 共 6 条',
    )

    await selectHeroUiOption(user, '每页条数', '10')

    expect(await screen.findByText('资料 1')).toBeInTheDocument()
    expect(screen.getByText('资料 6')).toBeInTheDocument()
    expect(screen.getByTestId('rag-documents-pagination-summary')).toHaveTextContent('显示 1-6 / 共 6 条')
    expect(screen.queryByTestId('rag-documents-pagination')).not.toBeInTheDocument()

    const actionCells = screen.getAllByLabelText('查看详情')
    expect(actionCells).toHaveLength(6)
    const editableButtons = screen.getAllByLabelText('编辑资料')
    expect(editableButtons).toHaveLength(4)

    const firstRow = screen.getByText('资料 1').closest('div.grid')
    expect(firstRow).not.toBeNull()
    if (firstRow instanceof HTMLElement) {
      expect(within(firstRow).getByText('可编辑')).toBeInTheDocument()
    }
  })

  it('shows ellipsis for large pagination and returns to previous page after deleting last visible row', async () => {
    const user = userEvent.setup()
    let documents = Array.from({ length: 36 }, (_, index) => ({
      id: `user-doc:${index + 1}:und`,
      title: `资料 ${index + 1}`,
      contentType: 'tech_blog',
      sourceScope: 'published',
      preview: `预览 ${index + 1}`,
      editable: true,
      createdAt: `2026-06-${String(index + 1).padStart(2, '0')}T08:00:00.000Z`,
      updatedAt: `2026-06-${String(index + 1).padStart(2, '0')}T08:30:00.000Z`,
    }))

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith('/api/ai/rag/documents') && (!init?.method || init.method === 'GET')) {
        return new Response(
          JSON.stringify({ data: documents }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.endsWith('/api/ai/rag/documents/user-doc:36:und') && init?.method === 'DELETE') {
        documents = documents.filter((item) => item.id !== 'user-doc:36:und')
        return new Response(JSON.stringify({ data: { deleted: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url.endsWith('/api/ai/rag/index/rebuild') || url.endsWith('/api/ai/rag/user-docs/reconcile')) {
        return new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      throw new Error(`Unhandled fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    const view = render(<RagManageShell locale="zh" />)

    await user.click(screen.getByRole('tab', { name: '已入库管理' }))

    expect(await screen.findByText('资料 1')).toBeInTheDocument()
    expect(screen.getByTestId('rag-documents-pagination-summary')).toHaveTextContent('显示 1-20 / 共 36 条')

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(await screen.findByText('资料 36')).toBeInTheDocument()
    expect(screen.queryByText('资料 16')).not.toBeInTheDocument()
    expect(screen.getByTestId('rag-documents-pagination-summary')).toHaveTextContent(
      '显示 21-36 / 共 36 条',
    )

    const lastRow = screen.getByText('资料 36').closest('div.grid')
    expect(lastRow).not.toBeNull()
    if (!(lastRow instanceof HTMLElement)) {
      throw new Error('未找到资料 36 对应行')
    }

    const deleteTrigger = within(lastRow).getByLabelText('删除')
    await user.click(deleteTrigger)
    await user.click(screen.getByRole('button', { name: '删除' }))

    expect(await screen.findByText('资料 21')).toBeInTheDocument()
    expect(screen.getByText('资料 35')).toBeInTheDocument()
    expect(screen.queryByText('资料 36')).not.toBeInTheDocument()
    expect(screen.getByTestId('rag-documents-pagination-summary')).toHaveTextContent(
      '显示 21-35 / 共 35 条',
    )
    expect(await screen.findByText('资料已删除，并同步清理向量数据。')).toBeInTheDocument()
  })

  it('supports exporting and resetting user_docs from manage actions', async () => {
    const user = userEvent.setup()
    let documents = [
      {
        id: 'user-doc:1:und',
        title: '资料 1',
        contentType: 'tech_blog',
        summary: '概览 1',
        sourceScope: 'published',
        preview: '预览 1',
        editable: true,
        createdAt: '2026-06-10T08:00:00.000Z',
        updatedAt: '2026-06-10T08:30:00.000Z',
      },
    ]

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith('/api/ai/rag/documents') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify({ data: documents }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url.endsWith('/api/ai/rag/user-docs/export') && init?.method === 'POST') {
        return new Response(JSON.stringify({ data: { documentCount: 1 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url.endsWith('/api/ai/rag/user-docs/reconcile') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            data: {
              deletedOrphans: [],
              reindexedDocuments: ['user-doc:1:und'],
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      if (url.endsWith('/api/ai/rag/user-docs/reset') && init?.method === 'POST') {
        documents = []
        return new Response(
          JSON.stringify({
            data: {
              deletedDocumentIds: ['user-doc:1:und'],
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      if (url.endsWith('/api/ai/rag/index/rebuild')) {
        return new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      throw new Error(`Unhandled fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<RagManageShell locale="zh" />)

    await user.click(screen.getByRole('tab', { name: '已入库管理' }))
    expect(await screen.findByText('资料 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '同步 user_docs 向量' }))
    expect(
      await screen.findByText('user_docs 向量同步完成：清理残留 0 条，重建资料 1 条。'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '更多 user_docs 操作' }))
    await user.click(screen.getByRole('menuitem', { name: '备份 user_docs' }))
    expect(await screen.findByText('user_docs 备份完成：共导出 1 条资料。')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '更多 user_docs 操作' }))
    await user.click(screen.getByRole('menuitem', { name: '清空 user_docs' }))
    expect(await screen.findByText('user_docs 已清空：删除 1 条资料，并清理对应向量。')).toBeInTheDocument()
    expect(await screen.findByText('暂无入库资料')).toBeInTheDocument()
  })
})
