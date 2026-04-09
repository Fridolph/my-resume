<template>
  <nav
    class="dark-transition group invisible absolute -top-10 right-[112px] z-10 h-8 w-auto min-w-8 -translate-x-1/2 overflow-hidden rounded bg-white dark:bg-[var(--dark-bg-hover)] md:visible"
    :class="{ 'is-checked': checked }">
    <input
      type="checkbox"
      class="nav__cb peer pointer-events-none absolute left-0 top-0 z-0 opacity-0"
      id="menuCb"
      v-model="checked"
      @change="onChange" />
    <div
      :class="{ 'peer-checked:w-[380px]': isZw, 'peer-checked:w-[420px]': !isZw }"
      class="nav__content transition-width relative flex h-full w-8 flex-row duration-700 peer-checked:w-[380px]">
      <ul
        class="nav__list relative flex h-full w-[510px] translate-x-5 flex-row px-5 text-[0px] *:cursor-pointer *:px-2 *:text-center *:align-top *:text-sm *:font-bold *:leading-8">
        <li class="nav__item">
          <a
            href="#Education"
            class="nav__item-text ease-[cubic-bezier(0.48, 0.43, 0.7, 2.5)] block h-full w-max -rotate-[20deg] leading-8 opacity-100 transition-all duration-700"
            >{{ t('anchor.a1') }}</a
          >
        </li>
        <li class="nav__item">
          <a
            href="#Skill"
            class="nav__item-text ease-[cubic-bezier(0.48, 0.43, 0.7, 2.5)] block h-full w-max -rotate-[20deg] leading-8 opacity-100 transition-all duration-700"
            >{{ t('anchor.a2') }}</a
          >
        </li>
        <li class="nav__item">
          <a
            href="#Experience"
            class="nav__item-text ease-[cubic-bezier(0.48, 0.43, 0.7, 2.5)] block h-full w-max -rotate-[20deg] leading-8 opacity-100 transition-all duration-700"
            >{{ t('anchor.a3') }}</a
          >
        </li>
        <li class="nav__item">
          <a
            href="#Personal"
            class="nav__item-text ease-[cubic-bezier(0.48, 0.43, 0.7, 2.5)] block h-full w-max -rotate-[20deg] leading-8 opacity-100 transition-all duration-700"
            >{{ t('anchor.a4') }}</a
          >
        </li>
      </ul>
    </div>
    <label
      class="nav__btn height-8 absolute right-0 top-0 z-50 w-8 -translate-x-2 -translate-y-1 cursor-pointer p-4"
      for="menuCb"></label>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

const isZw = computed(() => locale.value === 'zh')
const checked = ref(false)

const onChange = () => {
  // console.log('onChange: ', checked.value)
}
</script>

<style scoped>
.nav__item {
  perspective: 400px;
}

.nav__cb:checked ~ .nav__content .nav__item-text {
  transform: rotate(0);
  opacity: 1;
  transition:
    transform 0.7s cubic-bezier(0.48, 0.43, 0.7, 2.5),
    opacity 0.2s;
}

.nav__item:nth-child(1) .nav__item-text {
  transition-delay: 0.3s;
}
.nav__cb:checked ~ .nav__content .nav__item:nth-child(1) .nav__item-text {
  transition-delay: 0s;
}
.nav__item:nth-child(2) .nav__item-text {
  transition-delay: 0.2s;
}
.nav__cb:checked ~ .nav__content .nav__item:nth-child(2) .nav__item-text {
  transition-delay: 0.1s;
}
.nav__item:nth-child(3) .nav__item-text {
  transition-delay: 0.1s;
}
.nav__cb:checked ~ .nav__content .nav__item:nth-child(3) .nav__item-text {
  transition-delay: 0.2s;
}
.nav__item:nth-child(4) .nav__item-text {
  transition-delay: 0s;
}
.nav__cb:checked ~ .nav__content .nav__item:nth-child(4) .nav__item-text {
  transition-delay: 0.3s;
}

.nav__btn:before,
.nav__btn:after {
  content: '';
  display: block;
  width: 18px;
  height: 3px;
  border-radius: 2px;
  background: var(--text);
  transform-origin: 50% 50%;
  transition:
    transform 1s cubic-bezier(0.48, 0.43, 0.29, 1.3),
    background-color 0.3s;
}

.nav__btn:before {
  margin-bottom: 5px;
}
.nav__btn:hover:before,
.nav__btn:hover:after {
  background: #00bdea;
}
.nav__cb:checked ~ .nav__btn:before {
  transform: translateY(1px) rotate(-225deg);
}
.nav__cb:checked ~ .nav__btn:after {
  transform: translateY(-7px) rotate(225deg);
}
</style>
