'use client'

import { Chip } from '@heroui/react'

import type { AiChatCardMediaPreview, AiChatMessageBlock } from '@my-resume/api-client'
import type {
  AiChatAnswerBlockRendererLocale,
  AiChatAnswerBlockRendererProps,
  BlockShellProps,
} from './types/ai-chat-answer-block-renderer.types'

const TONE_CLASS_NAMES: Record<NonNullable<BlockShellProps['tone']>, string> = {
  amber:
    'border-amber-200/80 bg-amber-50/75 dark:border-amber-500/20 dark:bg-amber-500/10',
  emerald:
    'border-emerald-200/80 bg-emerald-50/75 dark:border-emerald-500/20 dark:bg-emerald-500/10',
  sky: 'border-sky-200/80 bg-sky-50/75 dark:border-sky-500/20 dark:bg-sky-500/10',
  violet:
    'border-violet-200/80 bg-violet-50/75 dark:border-violet-500/20 dark:bg-violet-500/10',
  zinc: 'border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/70',
}

function BlockShell({ children, tone = 'zinc', className }: BlockShellProps) {
  return (
    <article
      className={[
        'grid gap-2 rounded-2xl border p-3 shadow-[0_14px_36px_rgba(15,23,42,0.05)]',
        TONE_CLASS_NAMES[tone],
        className,
      ].join(' ')}>
      {children}
    </article>
  )
}

function BlockHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="grid gap-1">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
        {eyebrow}
      </span>
      <div className="grid gap-0.5">
        <strong className="text-sm leading-5 text-zinc-950 dark:text-white">{title}</strong>
        {subtitle ? (
          <span className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{subtitle}</span>
        ) : null}
      </div>
    </div>
  )
}

function KeywordList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Chip key={item} size="sm" variant="soft">
          {item}
        </Chip>
      ))}
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul className="grid gap-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
      {items.map((item) => (
        <li className="flex gap-1.5" key={item}>
          <span aria-hidden="true" className="mt-2 size-1 rounded-full bg-current opacity-50" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function InlineCardLink({
  children,
  href,
}: {
  children: string
  href: string
}) {
  return (
    <a
      className="inline-flex w-fit items-center rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-zinc-600"
      href={href}
      rel="noreferrer"
      target="_blank">
      {children}
    </a>
  )
}

function CardImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return null
  }

  return (
    <img
      alt={alt}
      className="max-h-40 w-full rounded-xl object-cover"
      src={src}
    />
  )
}

function MediaPreviewList({
  items,
  locale,
}: {
  items?: AiChatCardMediaPreview[]
  locale: AiChatAnswerBlockRendererLocale
}) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="grid gap-1.5">
      {items.map((item) => (
        <a
          className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/60 p-2 text-xs text-zinc-600 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:border-zinc-700"
          href={item.url}
          key={`${item.type}:${item.url}`}
          rel="noreferrer"
          target="_blank">
          {item.thumbnailUrl ? (
            <img
              alt=""
              className="size-10 rounded-lg object-cover"
              src={item.thumbnailUrl}
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-lg bg-zinc-100 text-[0.65rem] font-semibold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {item.type}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">
            {item.title ?? (locale === 'en' ? 'Open media' : '查看媒体')}
          </span>
        </a>
      ))}
    </div>
  )
}

function userDocCategoryMeta(
  category: 'hobby' | 'tech_blog' | 'knowledge_column' | 'general' | undefined,
  locale: AiChatAnswerBlockRendererLocale,
) {
  if (category === 'hobby') {
    return {
      label: locale === 'en' ? 'Hobby' : '兴趣爱好',
      tone: 'amber' as const,
      chipClassName: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
    }
  }

  if (category === 'knowledge_column') {
    return {
      label: locale === 'en' ? 'Knowledge Column' : '知识专栏',
      tone: 'sky' as const,
      chipClassName: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
    }
  }

  if (category === 'general') {
    return {
      label: locale === 'en' ? 'General' : '其他通用',
      tone: 'zinc' as const,
      chipClassName: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
    }
  }

  return {
    label: locale === 'en' ? 'Tech Blog' : '技术博客',
    tone: 'violet' as const,
    chipClassName: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200',
  }
}

function UserDocCard({
  category,
  imageUrl,
  keywords,
  linkDisplayTitle,
  locale,
  media,
  summary,
  title,
  url,
}: {
  category?: 'hobby' | 'tech_blog' | 'knowledge_column' | 'general'
  imageUrl?: string
  keywords: string[]
  linkDisplayTitle?: string
  locale: AiChatAnswerBlockRendererLocale
  media?: AiChatCardMediaPreview[]
  summary: string
  title: string
  url?: string
}) {
  const meta = userDocCategoryMeta(category, locale)

  return (
    <BlockShell tone={meta.tone}>
      <div className={`grid gap-3 ${imageUrl ? 'md:grid-cols-[minmax(0,1fr)_9rem]' : ''} md:items-start`}>
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Chip className={meta.chipClassName} size="sm" variant="soft">
              {meta.label}
            </Chip>
            {keywords.slice(0, 2).map((item) => (
              <Chip key={item} size="sm" variant="soft">
                {item}
              </Chip>
            ))}
          </div>
          <strong className="text-sm leading-5 text-zinc-950 dark:text-white">{title}</strong>
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{summary}</p>
          <MediaPreviewList items={media} locale={locale} />
          {url ? (
            <InlineCardLink href={url}>
              {linkDisplayTitle || (locale === 'en' ? 'Open link' : '查看链接')}
            </InlineCardLink>
          ) : null}
        </div>
        {imageUrl ? <CardImage alt={title} src={imageUrl} /> : null}
      </div>
    </BlockShell>
  )
}

function renderCardBlock(block: AiChatMessageBlock, locale: AiChatAnswerBlockRendererLocale) {
  if (block.type === 'project_card') {
    return (
      <BlockShell tone="sky">
        <CardImage alt={block.title} src={block.imageUrl} />
        <BlockHeader
          eyebrow={locale === 'en' ? 'Project' : '项目'}
          subtitle={[block.subtitle, block.period].filter(Boolean).join(' · ')}
          title={block.title}
        />
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{block.summary}</p>
        <KeywordList items={block.technologies} />
        <BulletList items={block.highlights} />
        {block.url ? (
          <InlineCardLink href={block.url}>
            {locale === 'en' ? 'Open project' : '查看项目'}
          </InlineCardLink>
        ) : null}
      </BlockShell>
    )
  }

  if (block.type === 'experience_card') {
    return (
      <BlockShell tone="emerald">
        <BlockHeader
          eyebrow={locale === 'en' ? 'Experience' : '经历'}
          subtitle={[block.subtitle, block.period].filter(Boolean).join(' · ')}
          title={block.title}
        />
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{block.summary}</p>
        <KeywordList items={block.technologies} />
        <BulletList items={block.highlights} />
      </BlockShell>
    )
  }

  if (block.type === 'hobby_card') {
    return (
      <UserDocCard
        category="hobby"
        imageUrl={block.imageUrl}
        keywords={block.keywords}
        locale={locale}
        media={block.media}
        summary={block.description}
        title={block.title}
        url={block.url}
      />
    )
  }

  if (block.type === 'article_card') {
    return (
      <UserDocCard
        category={block.category ?? 'tech_blog'}
        imageUrl={block.imageUrl}
        keywords={block.keywords}
        locale={locale}
        media={block.media}
        summary={block.summary}
        title={block.title}
        url={block.url}
      />
    )
  }

  if (block.type === 'media_card') {
    return (
      <BlockShell tone="zinc">
        <CardImage alt={block.title} src={block.thumbnailUrl ?? block.imageUrl} />
        <BlockHeader eyebrow={locale === 'en' ? 'Media' : '媒体'} title={block.title} />
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{block.description}</p>
        <InlineCardLink href={block.url}>
          {locale === 'en' ? 'Open media' : '查看媒体'}
        </InlineCardLink>
      </BlockShell>
    )
  }

  if (block.type === 'summary') {
    return (
      <BlockShell tone="emerald">
        <BlockHeader eyebrow={locale === 'en' ? 'Summary' : '总结'} title={block.title} />
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{block.summary}</p>
        <KeywordList items={block.keywords} />
      </BlockShell>
    )
  }

  if (block.type === 'system_notice') {
    const tone = block.tone === 'warning' ? 'amber' : block.tone === 'success' ? 'emerald' : 'sky'

    return (
      <BlockShell tone={tone}>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{block.text}</p>
      </BlockShell>
    )
  }

  if (block.type === 'text') {
    return (
      <BlockShell tone="zinc">
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">{block.text}</p>
      </BlockShell>
    )
  }

  return null
}

export function AiChatAnswerBlockRenderer({
  blocks,
  locale,
}: AiChatAnswerBlockRendererProps) {
  if (blocks.length === 0) {
    return null
  }

  return (
    <div className="grid w-full gap-2 px-1" data-testid="ai-chat-answer-blocks">
      {blocks.map((block, index) => (
        <div key={`${block.type}-${index}`}>{renderCardBlock(block, locale)}</div>
      ))}
    </div>
  )
}
