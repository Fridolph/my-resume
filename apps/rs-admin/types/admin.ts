/**
 * rs-admin 导航类型定义。
 *
 * 导航数据与渲染分离：config 提供数据，布局组件负责渲染（配置驱动）。
 * 结构对齐 dao-monorepo-temp：支持两级导航 + 外部导航区（侧栏底部）。
 */
export interface AdminNavigationItem {
  /** 唯一 key，用于菜单选中/展开态 */
  key: string
  /** 显示文案 */
  label: string
  /** 图标标识（布局层映射为具体图标组件） */
  icon?: string
  /** 路由地址（有 children 时可选） */
  to?: string
  /** 是否默认展开（用于含 children 的分组） */
  defaultOpen?: boolean
  /** 子菜单 */
  children?: AdminNavigationItem[]
}

export interface AdminBrandConfig {
  name: string
  mark?: string
  logoSrc?: string
  href?: string
}

/** 顶部面包屑项 */
export interface AdminBreadcrumb {
  label: string
  to?: string
}
