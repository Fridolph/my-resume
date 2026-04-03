import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@heroui/react';
import { ReactNode } from 'react';

interface PublishedResumeSectionCardProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function PublishedResumeSectionCard({
  eyebrow,
  title,
  description,
  children,
}: PublishedResumeSectionCardProps) {
  return (
    <Card className="web-section-card">
      <CardHeader className="gap-3">
        <p className="web-eyebrow">{eyebrow}</p>
        <CardTitle className="text-2xl text-slate-950 dark:text-white">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  );
}
