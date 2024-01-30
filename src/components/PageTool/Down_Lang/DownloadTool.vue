<template>
  <div class="flex item-center justify-center hover:text-sky-400">
    <Tooltip
      :content="t('download')"
      :width="130">
      <Iconfont
        :size="22"
        name="xiazai"
        @click="downloadPdf" />
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../Iconfont/Iconfont.vue'
import { Tooltip } from 'fri-element-plus'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

function downloadPdf() {
  let $el = document.createElement('a')
  $el.href = 'http://resume.fridolph.top/fuyinsheng-webFE.pdf'
  $el.target = '_blank'
  $el.download = `付寅生-本科8年-Web前端.pdf`
  document.body.appendChild($el)
  $el.click()
  document.body.removeChild($el)
}
</script>
