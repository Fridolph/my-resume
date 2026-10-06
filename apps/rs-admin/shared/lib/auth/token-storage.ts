/**
 * 访问令牌存储（单一来源）。
 * 避免 token 散布在组件里（旧 admin 教训）。
 */
const TOKEN_KEY = 'rs-admin:access-token'

export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(TOKEN_KEY)
  },
  set(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token)
  },
  clear(): void {
    window.localStorage.removeItem(TOKEN_KEY)
  },
}
