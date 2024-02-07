// 为了更好的示范，终于发现个例子了
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

export default function () {
  const { locale } = useI18n()
  const isZh = computed(() => locale.value === 'zh')

  function toggleLang() {
    if (isZh.value) {
      locale.value = 'en'
    } else {
      locale.value = 'zh'
    }
  }

  return {
    locale,
    isZh,
    toggleLang,
  }
}
