<script setup lang="ts">
usePageSeo({
  title: '在线简历 · Fridolph Web',
  description: '在线简历页面骨架，后续将接入结构化简历数据与多语言内容。',
  path: '/resume'
})

const sections = [
  {
    title: '基础信息',
    description: '展示个人身份、目标岗位和核心介绍。',
    highlights: ['姓名', '岗位方向', '城市', '个人简介']
  },
  {
    title: '教育经历',
    description: '承载学历、学校与教育背景摘要。',
    highlights: ['学校', '学历', '时间范围']
  },
  {
    title: '工作经历',
    description: '承载公司经历、职责和项目摘要。',
    highlights: ['公司', '职位', '时间范围', '项目摘要']
  },
  {
    title: '技能亮点',
    description: '展示前端能力、工程化能力和跨端能力。',
    highlights: ['Vue / Nuxt', 'TypeScript', '工程化', '性能优化']
  },
  {
    title: '联系方式',
    description: '承载邮箱、社交账号和简历导出入口。',
    highlights: ['邮箱', 'GitHub', '下载链接']
  }
]
</script>

<template>
  <WebPageContainer>
    <WebSectionIntro
      badge="Resume Components"
      title="在线简历"
      description="W3 阶段已经把简历页的章节渲染抽象为可复用卡片。后续接入后台数据时，这一页会直接消费结构化内容，而不再把简历内容写死在模板里。"
    />

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <WebResumeBlockCard
        v-for="section in sections"
        :key="section.title"
        :title="section.title"
        :description="section.description"
        :highlights="section.highlights"
      />
    </div>
  </WebPageContainer>
</template>
