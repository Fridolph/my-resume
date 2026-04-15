import { redirect } from 'next/navigation'

/**
 * 后台首页保持极薄，只负责挂载登录壳
 *
 * @returns 后台登录页节点
 */
export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  redirect('/login')
}
