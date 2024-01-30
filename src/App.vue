<template>
  <div class="w-full min-h-screen md:flex md:justify-center md:align-middle p-0 bg-[#c5dae2] md:py-[5vh] md:px-[5vw]">
    <section
      class="sm:w-full md:w-full max-w-[1600px] flex flex-col md:flex-row justify-center align-middle text-color shadow-2xl">
      <Aside>
        <Avatar />
        <div class="scrollbar hover:overflow-y-auto pr-[12px] hover:pr-[6px]">
          <Baseinfo />
          <Contact />
          <Hobby />
          <Wechat />
        </div>
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
import Aside from './components/Layouts/Aside.vue'
import Avatar from './views/Avatar/Avatar.vue'
import Baseinfo from './views/Baseinfo/Baseinfo.vue'
import Contact from './views/Contact/Contact.vue'
import Hobby from './views/Hobby/Hobby.vue'
import Wechat from './views/Wechat/Wechat.vue'
// -------------------------------------------
import Main from './components/Layouts/Main.vue'
import Education from './views/Education/Education.vue'
import Skill from './views/Skill/Skill.vue'
import Experience from './views/Experience/Experience.vue'
import Personal from './views/Personal/Personal.vue'
import Thanks from './views/Thanks/Thanks.vue'
</script>

