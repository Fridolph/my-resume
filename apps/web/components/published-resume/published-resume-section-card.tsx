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
    <section className="section-card">
      <div className="section-header">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-subtitle">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
