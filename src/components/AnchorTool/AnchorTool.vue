<template>
  <nav
    class="z-10 invisible md:visible group overflow-hidden absolute right-[76px] -top-10 min-w-8 rounded w-auto h-8 bg-white -translate-x-1/2"
    :class="{ 'is-checked': checked }">
    <input
      type="checkbox"
      class="nav__cb peer z-0 absolute left-0 top-0 opacity-0 pointer-events-none"
      id="menuCb"
      v-model="checked"
      @change="onChange" />
    <div
      class="nav__content relative flex flex-row w-8 h-full transition-width duration-700 peer-checked:w-[380px]">
      <ul
        class="nav__list relative w-[610px] h-full px-5 text-[0px] flex flex-row translate-x-5 *:align-top *:px-2 *:text-center *:text-sm *:leading-8 *:font-bold *:cursor-pointer">
        <li class="nav__item">
          <a
            href="#Education"
            class="nav__item-text block h-full w-max leading-8 -rotate-[20deg] opacity-100 transition-all duration-700 ease-[cubic-bezier(0.48, 0.43, 0.7, 2.5)]"
            >教育经历</a
          >
        </li>
        <li class="nav__item">
          <a
            href="#Skill"
            class="nav__item-text block h-full w-max leading-8 -rotate-[20deg] opacity-100 transition-all duration-700 ease-[cubic-bezier(0.48, 0.43, 0.7, 2.5)]"
            >专业技能</a
          >
        </li>
        <li class="nav__item">
          <a
            href="#Experience"
            class="nav__item-text block h-full w-max leading-8 -rotate-[20deg] opacity-100 transition-all duration-700 ease-[cubic-bezier(0.48, 0.43, 0.7, 2.5)]"
            >工作经历</a
          >
        </li>
        <li class="nav__item">
          <a
            href="#Personal"
            class="nav__item-text block h-full w-max leading-8 -rotate-[20deg] opacity-100 transition-all duration-700 ease-[cubic-bezier(0.48, 0.43, 0.7, 2.5)]"
            >个人项目</a
          >
        </li>
      </ul>
    </div>
    <label
      class="nav__btn z-50 absolute right-0 top-0 w-8 height-8 p-4 cursor-pointer -translate-x-2 -translate-y-1"
      for="menuCb"></label>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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
  transition: transform 0.7s cubic-bezier(0.48, 0.43, 0.7, 2.5), opacity 0.2s;
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
  background: var(--fri-text-color);
  transform-origin: 50% 50%;
  transition: transform 1s cubic-bezier(0.48, 0.43, 0.29, 1.3), background-color 0.3s;
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
