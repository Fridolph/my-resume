import { defineStore } from 'pinia'

export const useCommonStore = defineStore('common', {
  state: () => ({
    theme: 'light',
  }),
  getters: {
    isDark: state => state.theme === 'dark',
  },
  actions: {
    switchTheme() {
      if (!this.isDark) {
        this.theme = 'dark'
        document.documentElement.classList.add('dark')
        console.log("🚢 ~ 当前打印的内容 ~ document.documentElement:", document.documentElement);
      } else {
        this.theme = 'light'
        document.documentElement.classList.remove('dark')
      }
    },
  },
})
