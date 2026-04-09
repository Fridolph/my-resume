import { Card, CardContent, CardHeader } from '@heroui/react/card'
import { ReactNode } from 'react'
import { DisplaySectionIntro } from '@my-resume/ui/display'
import styles from './published-resume-section-card.module.css'

interface PublishedResumeSectionCardProps {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function PublishedResumeSectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: PublishedResumeSectionCardProps) {
  return (
    <Card className={styles.sectionCard}>
      <CardHeader className="gap-3 pb-2.5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <DisplaySectionIntro
            className="min-w-0 gap-2"
            description={description}
            descriptionClassName="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400"
            eyebrow={eyebrow}
            eyebrowClassName="web-eyebrow"
            title={title}
            titleClassName="text-2xl text-slate-950 dark:text-white"
          />
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0.5">{children}</CardContent>
    </Card>
  )
}
