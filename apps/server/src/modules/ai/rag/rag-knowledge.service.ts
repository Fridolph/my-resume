import { Injectable } from '@nestjs/common'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { basename, join } from 'path'
import { parse } from 'yaml'

import { RagChunk } from './rag.types'

interface MarkdownFrontmatter {
  title?: string
  date?: string
}

interface MarkdownSection {
  title: string
  content: string
}

function normalizeChunkText(content: string): string {
  return content
    .replace(/^>\s?/gm, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^[:\-\s|]+$/gm, '')
    .replace(/```([\s\S]*?)```/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function splitMarkdownFrontmatter(markdown: string): {
  frontmatter: MarkdownFrontmatter
  body: string
} {
  if (!markdown.startsWith('---\n')) {
    return {
      frontmatter: {},
      body: markdown,
    }
  }

  const frontmatterEndIndex = markdown.indexOf('\n---\n', 4)

  if (frontmatterEndIndex === -1) {
    return {
      frontmatter: {},
      body: markdown,
    }
  }

  const frontmatterBlock = markdown.slice(4, frontmatterEndIndex)
  const body = markdown.slice(frontmatterEndIndex + 5)

  return {
    frontmatter: (parse(frontmatterBlock) as MarkdownFrontmatter | null) ?? {},
    body,
  }
}

function buildArticleSections(body: string): MarkdownSection[] {
  const normalizedBody = normalizeChunkText(body)

  if (!normalizedBody) {
    return []
  }

  const sections = normalizedBody.split(/(?=^##\s+)/gm)

  return sections
    .map((section, index) => {
      const trimmed = section.trim()

      if (!trimmed) {
        return null
      }

      const titleMatch = trimmed.match(/^##\s+(.+)$/m)

      if (!titleMatch) {
        return {
          title: index === 0 ? '导语' : `段落 ${index + 1}`,
          content: trimmed,
        }
      }

      return {
        title: titleMatch[1].trim(),
        content: trimmed.replace(/^##\s+.+$/m, '').trim(),
      }
    })
    .filter((item): item is MarkdownSection => Boolean(item && item.content))
}

@Injectable()
export class RagKnowledgeService {
  buildArticleChunksFromDirectory(directoryPath: string): RagChunk[] {
    if (!existsSync(directoryPath)) {
      return []
    }

    return readdirSync(directoryPath)
      .filter((fileName) => fileName.endsWith('.md'))
      .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
      .flatMap((fileName) =>
        this.buildArticleChunksFromMarkdown(
          readFileSync(join(directoryPath, fileName), 'utf8'),
          join(directoryPath, fileName),
        ),
      )
  }

  buildArticleChunksFromMarkdown(markdown: string, sourcePath: string): RagChunk[] {
    const { frontmatter, body } = splitMarkdownFrontmatter(markdown)
    const sections = buildArticleSections(body)
    const articleId = basename(sourcePath, '.md')
    const articleTitle = frontmatter.title?.trim() || articleId

    // 文章知识库按语义段落切块，而不是整篇入库，避免问答时被大段无关内容稀释。
    return sections.map((section, index) => ({
      id: `knowledge-${articleId}-${index + 1}`,
      title:
        section.title === '导语' ? articleTitle : `${articleTitle} / ${section.title}`,
      section: 'knowledge',
      sourceType: 'knowledge',
      sourcePath,
      content: [
        `知识文章：${articleTitle}`,
        frontmatter.date ? `发布时间：${frontmatter.date}` : null,
        section.title === '导语' ? null : `章节：${section.title}`,
        section.content,
      ]
        .filter((item): item is string => Boolean(item))
        .join('\n'),
    }))
  }
}
