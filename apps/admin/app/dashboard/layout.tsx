import type { ReactNode } from 'react';

import { AdminProtectedLayout } from '../../components/admin/protected-layout';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminProtectedLayout>{children}</AdminProtectedLayout>;
}
