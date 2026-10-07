import { redirect } from 'next/navigation'

/**
 * /settings 索引：重定向到第一个设置子页（对齐 dao settings/index.vue）。
 */
export default function SettingsIndexPage() {
  redirect('/settings/profile')
}
