import { FileExtractionResult } from './ai-file-types'

interface ExtractTextFromFileInput {
  apiBaseUrl: string
  accessToken: string
  file: File
}

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`
}

export async function extractTextFromFile(
  input: ExtractTextFromFileInput,
): Promise<FileExtractionResult> {
  const formData = new FormData()
  formData.append('file', input.file)

  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/ai/extract-text'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[]
    } | null

    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message

    throw new Error(message || '文件提取失败，请稍后重试')
  }

  return (await response.json()) as FileExtractionResult
}
