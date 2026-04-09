import { defineStore } from 'pinia'

// 其实这项目还真用不到 pinia
// 这里只是为了演示顺便就加进来了请勿吐槽
export const useCommonStore = defineStore('common', {
  state: () => ({
    theme: 'light',
    locale: 'zh',
  }),
  getters: {
    isDark: (state) => state.theme === 'dark',
  },
  actions: {
    switchTheme() {
      if (!this.isDark) {
        this.theme = 'dark'
        document.documentElement.classList.add('dark')
      } else {
        this.theme = 'light'
        document.documentElement.classList.remove('dark')
      }
      console.log('🚢 丝滑切换主题')
    },
  },
})
