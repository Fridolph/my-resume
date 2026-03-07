import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [],

  alias: {
    '@repo/types': fileURLToPath(new URL('../../packages/types/src', import.meta.url)),
    '@repo/content-schema': fileURLToPath(new URL('../../packages/content-schema/src', import.meta.url)),
    '@repo/sdk': fileURLToPath(new URL('../../packages/sdk/src', import.meta.url)),
    '@repo/database': fileURLToPath(new URL('../../packages/database/src', import.meta.url)),
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

  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-CN'
      }
    }
  },

  routeRules: {
    '/': { prerender: true }
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
