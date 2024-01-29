<template>
  <Section
    title="兴趣爱好"
    icon="xingquaihao">
    <div class="flex flex-wrap justify-start">
      <Yumaoqiu />
      <Steam />
      <Book />
      <Baseball />
      <Camera />
      <Music />
      <Movie />
      <Singer />
    </div>
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import Yumaoqiu from './1yuqiu.vue'
import Baseball from './2baseball.vue'
import Camera from './3camera.vue'
import Music from './4music.vue'
import Movie from './5movie.vue'
import Singer from './6singer.vue'
import Steam from './7steam.vue'
import Book from './8book.vue'
</script>
