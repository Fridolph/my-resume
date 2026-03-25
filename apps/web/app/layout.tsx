import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'my-resume web',
  description: 'Public resume web shell',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html data-template="default" data-theme="light" lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
