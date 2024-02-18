<template>
  <div
    class="mb-5 text-orange-400 cursor-help"
    @click="toggle">
    {{ t('education.verify') }} 👮‍♂️
  </div>
  <div
    class="flex transition-all duration-500 overflow-hidden"
    :class="{
      'h-0': !isShow,
      'h-20': isShow,
    }">
    <div class="size-20 mr-5">
      <img
        class="w-max"
        src="/img/chsi-qrcode.jpg"
        :alt="t('education.alt')" />
    </div>
    <div>
      <div>{{t('education.alt')}} <strong>ASDNR51E4S4V9WS1</strong></div>
      <div>
        {{t('education.p1')}}<a
          class="text-sky-600"
          href="https://www.chsi.com.cn/xlcx/bgcx.jsp"
          target="_blank"
          >学信网</a
        >
      </div>
      <div>{{t('education.p2')}}</div>
      <div>
        3.
        <a
          href="/img/chsi.jpg"
          class="text-sky-600"
          target="_blank"
          >{{t('education.check')}}</a
        >
        {{t('education.updated')}}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const isShow = ref(false)
const toggle = () => (isShow.value = !isShow.value)
</script>
