<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { session, logout } = useAuth()

function handleLogout() {
  void logout()
}
const quickLinks = [
  {
    title: '用户管理',
    description: '验证登录态、权限判断与用户管理模块。',
    to: '/users'
  },
  {
    title: '文案管理',
    description: '验证 namespace、locale、发布状态和缺失文案的管理入口。',
    to: '/translations'
  },
  {
    title: '简历管理',
    description: '维护基础信息、教育经历、工作经历、技能和联系方式，并验证多语言简历编辑方式。',
    to: '/resume'
  },
  {
    title: '项目管理',
    description: '维护项目列表、排序、标签、多语言说明、外链与封面字段，并验证发布状态流转。',
    to: '/projects'
  },
  {
    title: '站点设置',
    description: '维护默认语言、社交链接、下载资源与 SEO 默认配置，并完成后台第一阶段收尾。',
    to: '/settings'
  }
]
</script>

<template>
  <UContainer class="py-16 sm:py-24">
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-3">
          <UBadge label="P5-3 已接入真实服务端登录态" variant="subtle" color="primary" class="w-fit" />
          <div class="space-y-2">
            <h1 class="text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">
              欢迎回来，{{ session?.name }}
            </h1>
            <p class="max-w-2xl text-lg text-muted">
              当前账号角色为 {{ session?.role }}。现在后台已经切换到真实服务端 session 登录态，并具备登录、登出、路由守卫、基础权限判断、用户管理、文案管理、简历管理、项目管理与站点配置模块入口。
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <UBadge :label="session?.email || '未登录'" color="neutral" variant="subtle" />
          <UButton label="退出登录" color="neutral" variant="subtle" @click="handleLogout" />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <UCard v-for="link in quickLinks" :key="link.to">
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                {{ link.title }}
              </h2>
              <p class="text-sm text-muted">
                {{ link.description }}
              </p>
            </div>
          </template>

          <template #footer>
            <UButton :to="link.to" label="进入页面" variant="subtle" color="neutral" />
          </template>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
