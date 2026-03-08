import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [],

  alias: {
    '@repo/types': fileURLToPath(new URL('../../packages/types/src', import.meta.url)),
    '@repo/content-schema': fileURLToPath(new URL('../../packages/content-schema/src', import.meta.url)),
    '@repo/sdk': fileURLToPath(new URL('../../packages/sdk/src', import.meta.url)),
    '@repo/ui': fileURLToPath(new URL('../../packages/ui/src', import.meta.url))
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      publicApiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api/public',
      siteUrl: 'https://fridolph.com',
      siteName: 'Fridolph Web',
      siteDescription: '个人内容展示站，承载主页、简历、项目与多语言内容。',
      defaultLocale: 'zh-CN',
      locales: [
        { code: 'zh-CN', iso: 'zh-CN', name: '简体中文' },
        { code: 'en-US', iso: 'en-US', name: 'English' }
      ]
    }
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-CN'
      },
      meta: [
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#0f172a' }
      ]
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/resume': { prerender: true },
    '/projects': { prerender: true },
    '/robots.txt': { prerender: true },
    '/sitemap.xml': { prerender: true },
    '/projects/**': { swr: 3600 }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  ui: {
    fonts: false
  }
})
