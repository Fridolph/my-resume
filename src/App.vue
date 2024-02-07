<template>
  <div
    class="w-full min-h-screen md:flex md:justify-center md:align-middle p-0 bg-[var(--page-bg)] md:py-[5vh] md:px-[5vw] dark:bg-[var(--dark-page-bg)]">
    <section
      class="sm:w-full md:w-full max-w-[1600px] flex flex-col md:flex-row justify-center align-middle text-color shadow-2xl">
      <AnchorTool />
      <DownloadTool />
      <ThemeChange />
      <Aside>
        <Avatar />
        <section class="scrollbar overflow-x-hidden overflow-y-auto pr-[12px] hover:pr-[6px]">
          <Baseinfo />
          <Contact />
          <Hobby />
        </section>
      </Aside>
      <Main>
        <Education />
        <Skill />
        <Experience />
        <Personal />
        <Thanks />
      </Main>
    </section>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import AnchorTool from './components/PageTool/AnchorTool/AnchorTool.vue'
import DownloadTool from './components/PageTool/Down_Lang/index.vue'
import ThemeChange from './components/PageTool/ThemeChange/ThemeChange.vue'
// ----------------------------------------------
import Aside from './components/Layouts/Aside.vue'
import Avatar from './views/Avatar/Avatar.vue'
import Baseinfo from './views/Baseinfo/Baseinfo.vue'
import Contact from './views/Contact/Contact.vue'
import Hobby from './views/Hobby/Hobby.vue'
// -------------------------------------------
import Main from './components/Layouts/Main.vue'
import Education from './views/Education/Education.vue'
import Skill from './views/Skill/Skill.vue'
import Experience from './views/Experience/Experience.vue'
import Personal from './views/Personal/Personal.vue'
import Thanks from './views/Thanks/Thanks.vue'

// 欢迎Fork本项目 - 简历是找工作中最重要的一笔
// 记得把信息替换成你自己的
onMounted(() => {
  document.title = '付寅生-本科-8年前端-成都'
})
</script>
