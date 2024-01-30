<template>
  <div
    class="invisible z-10 md:visible group absolute flex flex-row justify-between right-0 w-20 -top-10 h-8 leading-4 bg-white rounded p-2 cursor-pointer hover:ring-1 hover:ring-cyan-100">
    <div class="flex item-center justify-center hover:text-sky-400">
      <Tooltip
        content="下载pdf"
        :width="80">
        <Iconfont
          :size="22"
          name="xiazai"
          @click="downloadPdf" />
      </Tooltip>
    </div>
    <div class="w-[1px] h-8 bg-slate-300 -translate-y-2"></div>
    <div class="hover:text-sky-400">
      <Tooltip
        v-if="store.isZw"
        content="切换英文"
        :width="85">
        <Iconfont
          :size="22"
          name="zhongyingwen2zhongwen"
          @click="handleClick" />
      </Tooltip>

      <Tooltip
        v-else
        content="To Chinese"
        :width="100">
        <Iconfont
          :size="22"
          name="a-zhongyingwenyingwen"
          @click="handleClick" />
      </Tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../Iconfont/Iconfont.vue'
import { Tooltip } from 'fri-element-plus'
import { useCommonStore } from '../../store'

const store = useCommonStore()

function handleClick() {
  store.toggleLang()
}

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
