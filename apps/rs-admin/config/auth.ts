/**
 * 登录页分割布局配置（可配置左右图片）。
 */
export interface AuthLayoutConfig {
  /** 图片地址（留空则用渐变占位） */
  imageSrc?: string
  /** 图片无障碍描述 */
  imageAlt?: string
  /** 图片在左还是右 */
  imageSide?: 'left' | 'right'
}

export const authLayoutConfig: AuthLayoutConfig = {
  imageSide: 'right',
  imageAlt: 'RS Admin 登录背景',
  // 需要图片时填入，例如：
  // imageSrc: 'https://example.com/login-bg.jpg',
}
