import dynamic from 'next/dynamic'

import { AdminRouteLoadingCard } from '@/modules/workspace/route-loading-card'
import { isAppLocale } from '@/i18n/types'

const AdminAiWorkbenchShell = dynamic(
  () =>
    import('@/modules/ai/ai-workbench-shell').then(
      (module) => module.AdminAiWorkbenchShell,
    ),
  {
    loading: () => <AdminRouteLoadingCard message="正在加载 AI 工作台..." />,
  },
)

export default async function AdminAiWorkbenchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const routeLocale = isAppLocale(locale) ? locale : 'zh'

  return <AdminAiWorkbenchShell locale={routeLocale} />
}
