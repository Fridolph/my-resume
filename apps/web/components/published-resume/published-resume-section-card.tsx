import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@heroui/react';
import { ReactNode } from 'react';

interface PublishedResumeSectionCardProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function PublishedResumeSectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: PublishedResumeSectionCardProps) {
  return (
    <Card className="web-section-card web-content-section-card">
      <CardHeader className="gap-3 pb-2.5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="web-eyebrow">{eyebrow}</p>
            <CardTitle className="text-2xl text-slate-950 dark:text-white">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-0.5">{children}</CardContent>
    </Card>
  );
}
