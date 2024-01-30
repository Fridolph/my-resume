import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// setup Store
export const useCommonStore = defineStore('common', () => {
  const lang = ref('chinese')
  const isZw = computed(() => lang.value === 'chinese')

  function toggleLang() {
    console.log('改变前: ', lang.value, isZw.value);
    if (lang.value === 'chinese') {
      lang.value = 'english'
    } else if (lang.value === 'english') {
      lang.value = 'chinese'
    }
    console.log('改变后: ', lang.value, isZw.value);
  }
  
  return {
    lang,
    isZw,
    toggleLang,
  }
})

// Option Store 类似以前vue2的写法
// import { defineStore } from 'pinia'
// export const useCommonStore = defineStore('common', {
//   state: () => ({
//     lang: 'chinese'
//   }),
//   getters: {
//     isZw: (state) => state.lang === 'chinese'
//   },
//   actions: {
//     toggleLang() {
//       if (this.isZw) {
//         this.lang = 'english'
//       } else {
//         this.lang = 'chinese'
//       }
//     },
//   },
// })
