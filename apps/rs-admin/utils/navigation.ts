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

/** 收集所有 `defaultOpen` 的分组 key（用于菜单初始展开）。 */
export function collectDefaultOpenKeys(items: AdminNavigationItem[]): string[] {
  const keys: string[] = []
  for (const item of items) {
    if (item.children && item.defaultOpen) {
      keys.push(item.key)
    }
  }
  return keys
}

/** 收集包含当前路径的所有祖先分组 key（用于路由变化时自动展开）。 */
export function collectAncestorKeys(
  items: AdminNavigationItem[],
  pathname: string,
): string[] {
  for (const item of items) {
    if (item.to === pathname) {
      return []
    }
    if (item.children) {
      if (item.children.some(child => child.to === pathname)) {
        return [item.key]
      }
      const deeper = collectAncestorKeys(item.children, pathname)
      if (deeper.length > 0) {
        return [item.key, ...deeper]
      }
    }
  }
  return []
}
