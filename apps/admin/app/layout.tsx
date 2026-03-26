import './globals.css';

import { ThemeModeProvider } from '@my-resume/ui/theme';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'my-resume admin',
  description: 'Personal resume admin shell',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html data-theme="light" lang="zh-CN">
      <body>
        <ThemeModeProvider>{children}</ThemeModeProvider>
      </body>
    </html>
  );
}
