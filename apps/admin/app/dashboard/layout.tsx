import type { ReactNode } from 'react';

import { AdminProtectedLayout } from '../../components/admin/protected-layout';
import { AdminSessionProvider } from '../../lib/admin-session';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AdminSessionProvider>
      <AdminProtectedLayout>{children}</AdminProtectedLayout>
    </AdminSessionProvider>
  );
}
