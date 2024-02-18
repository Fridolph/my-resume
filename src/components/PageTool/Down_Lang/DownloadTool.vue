<template>
  <div class="flex item-center justify-center hover:text-sky-400 dark-transition">
    <Iconfont
      :size="22"
      name="xiazai"
      @click="downloadPdf" /> 
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../Iconfont/Iconfont.vue'
function downloadPdf() {
  let $el = document.createElement('a')
  $el.href = 'http://resume.fridolph.top/web_fuyinsheng_8y.pdf'
  $el.target = '_blank'
  $el.download = `付寅生-本科8年-Web前端.pdf`
  document.body.appendChild($el)
  $el.click()
  document.body.removeChild($el)
}
</script>
