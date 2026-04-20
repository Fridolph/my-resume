export const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5577'

const DEFAULT_APP_VERSION = '0.0.0'

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? DEFAULT_APP_VERSION
