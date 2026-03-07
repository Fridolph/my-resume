<script setup lang="ts">
usePageSeo({
  title: 'Fridolph Web',
  description: '个人内容展示站首页，承载个人简介、简历入口与项目展示入口。',
  path: '/'
})

const cards = [
  {
    title: '在线简历',
    description: '展示核心经历、技能摘要与职业背景。',
    to: '/resume',
    badge: 'Resume'
  },
  {
    title: '项目列表',
    description: '展示项目卡片、详情页和后续多语言内容入口。',
    to: '/projects',
    badge: 'Projects'
  },
  {
    title: '内容平台',
    description: '后续将接入后台管理后的结构化内容数据。',
    to: '/projects/resume-platform',
    badge: 'Platform'
  }
]

const stats = [
  {
    label: '当前阶段',
    value: 'W3',
    hint: '展示组件体系开始成形。'
  },
  {
    label: '页面骨架',
    value: '4 个',
    hint: '首页、简历页、项目列表页、项目详情页。'
  },
  {
    label: '复用组件',
    value: '6 个',
    hint: '卡片、标签、容器、页脚等基础展示组件。'
  }
]
</script>

<template>
  <WebPageContainer>
    <WebSectionIntro
      badge="W3 展示组件体系"
      title="Fridolph Web"
      description="W3 将 Web 从页面骨架推进到展示组件层。当前已抽出页面容器、统计卡片、功能卡片、简历区块卡片、项目预览卡片和标签组，为后续真实内容接入做准备。"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <WebStatCard
        v-for="stat in stats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :hint="stat.hint"
      />
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <WebFeatureCard
        v-for="card in cards"
        :key="card.to"
        :title="card.title"
        :description="card.description"
        :to="card.to"
        :badge="card.badge"
      />
    </div>
  </WebPageContainer>
</template>
