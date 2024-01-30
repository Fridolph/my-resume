<template>
  <ProjectWrap
    class="team-build pl-4"
    title="团队建设"
    :show-lib="false"
    icon="shejiao">
    <TitleDesc
      icon="shejiao"
      :show-icon="false"
      title="wskp-UI"
      description="集UI规范、代码规范、demo及其他各项约定于一身的内网在线文档。这是利用闲余时间的自发项目，初衷是便于产品和设计同事查看，有了实物能更好沟通、及时反馈。参考 ant design 文档编写，使用 vuepress 搭建并部署到内网中。" />

    <ListWrap
      title="核心内容："
      :list="teamContent"
      inner
      bold
      title-size="sm" />

    <ListWrap
      title="成长与收获："
      :list="teamReward"
      inner
      bold
      title-size="sm" />

    <TitleDesc
      icon="shejiao"
      :show-icon="false"
      title="wskp-mock"
      description="将 easy-mock 部署到内网，axios 模拟请求数据进行真实开发。" />

    <TitleDesc
      icon="shejiao"
      :show-icon="false"
      title="wskp-UI"
      :description="`部署在内网的一个自动打包、快速部署解决方案，方便开发和测试人员。<br/>可选择切换项目选择对应分支，自动打包生成Dist，并部署到内网，测试不同版本的项目。`" />
  </ProjectWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TitleDesc from '../../../components/TitleDesc/TitleDesc.vue'
import ProjectWrap from '../../../components/ProjectWrap/ProjectWrap.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'

const teamContent = ref([
  '- 团队制定UI规范；明确了公共变量名，主题色值等；',
  '- 前端代码规范(包括ESlint、Prettier等配置，模块、组件命名、写法和其他约定)；',
  '- theme 相关主题变量、normalize、mixin等；',
  '- 业务组件二次封装，为产品和UI提供demo示例；',
  '- 以基础组件为粒度的单元测试；',
  '- 尽可能详细的一份配套 vuepress 文档，方便后人乘凉。',
])

const teamReward = ref([
  '- 团队参与感，成员获得成就感',
  '- 每次提交即review，互相学习',
  '- 更加注重反馈与用户体验',
])
</script>

<style>
.team-build .iconfont {
  font-size: 20px !important;
  position: relative;
  top: -2px;
}
</style>
