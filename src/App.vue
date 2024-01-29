<template>
  <div class="w-full min-h-screen md:flex md:justify-center md:align-middle p-0  bg-[#778899] md:p-5 lg:p-10 xl:px-[5%] xl:py-20">
    <section
      class="sm:w-full md:w-full max-w-[1600px] flex flex-col md:flex-row justify-center align-middle text-color">
      <Aside>
        <Baseinfo />
        <Contact />
        <Hobby />
        <Wechat />
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
import Main from './components/Layouts/Main.vue'
import Baseinfo from './views/Baseinfo/Baseinfo.vue'
import Contact from './views/Contact/Contact.vue'
import Hobby from './views/Hobby/Hobby.vue'
import Wechat from './views/Wechat/Wechat.vue'
import Education from './views/Education/Education.vue'
import Skill from './views/Skill/Skill.vue'
import Experience from './views/Experience/Experience.vue'
import Personal from './views/Personal/Personal.vue'
import Thanks from './views/Thanks/Thanks.vue'
</script>

