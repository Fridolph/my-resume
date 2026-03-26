import { DisplaySectionIntro, DisplaySurfaceCard } from '@my-resume/ui/display';
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
    <DisplaySurfaceCard className="section-card">
      <DisplaySectionIntro
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      {children}
    </DisplaySurfaceCard>
  );
}
