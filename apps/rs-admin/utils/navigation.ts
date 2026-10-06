import type { AdminNavigationItem } from '@/types/admin'

/**
 * 在导航配置中查找与当前路径匹配的层级链（用于面包屑 / 页面标题）。
 * 命中返回 [父, 子] 链，未命中返回 []。
 */
export function findNavigationTrail(
  items: AdminNavigationItem[],
  pathname: string,
): AdminNavigationItem[] {
  for (const item of items) {
    if (item.to === pathname) {
      return [item]
    }
    if (item.children) {
      const childTrail = findNavigationTrail(item.children, pathname)
      if (childTrail.length > 0) {
        return [item, ...childTrail]
      }
    }
  }
  return []
}
