import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// setup Store
const useStore = defineStore('common', () => {
  return {
    
  }
})

export default useStore

// Option Store 类似以前vue2的写法
// import { defineStore } from 'pinia'
// export const useCommonStore = defineStore('common', {
//   state: () => ({
//     lang: 'zh'
//   }),
//   getters: {
//     isZw: (state) => state.lang === 'zh'
//   },
//   actions: {
//     toggleLang() {
//       if (this.isZw) {
//         this.lang = 'en'
//       } else {
//         this.lang = 'zh'
//       }
//     },
//   },
// })
