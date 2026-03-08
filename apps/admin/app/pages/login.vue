<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const route = useRoute()
const toast = useToast()
const { login, demoAccounts } = useAuth()

const form = reactive({
  email: 'root@fridolph.local',
  password: 'root123'
})
const loading = ref(false)

async function handleSubmit() {
  loading.value = true

  try {
    await login(form.email, form.password)
    toast.add({
      title: '登录成功',
      description: '已通过 api-server 建立真实登录态，并进入管理后台。',
      color: 'success'
    })
    await navigateTo(String(route.query.redirect || '/'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败，请稍后再试。'
    toast.add({
      title: '登录失败',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="py-16 sm:py-24">
    <div class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <UCard>
        <template #header>
          <div class="space-y-2">
            <UBadge label="P5-3 Admin 真实登录态" variant="subtle" color="primary" class="w-fit" />
            <h1 class="text-3xl font-bold text-highlighted">
              登录到 Fridolph Admin
            </h1>
            <p class="text-sm text-muted">
              当前阶段已切换为通过 `api-server` 的基础鉴权接口建立真实后台登录态，后续继续接入权限守卫与接口边界控制。
            </p>
          </div>
        </template>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <UFormField label="邮箱" name="email">
            <UInput v-model="form.email" type="email" placeholder="请输入邮箱" size="xl" class="w-full" />
          </UFormField>

          <UFormField label="密码" name="password">
            <UInput v-model="form.password" type="password" placeholder="请输入密码" size="xl" class="w-full" />
          </UFormField>

          <div class="flex items-center gap-3">
            <UButton type="submit" label="登录后台" :loading="loading" size="xl" />
            <span class="text-sm text-muted">登录后将通过服务端 session 访问首页、用户页、文案页与设置页。</span>
          </div>
        </form>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">
            演示账号
          </h2>
        </template>

        <ul class="space-y-3 text-sm text-muted">
          <li v-for="account in demoAccounts" :key="account.label" class="rounded-lg border border-default p-3">
            <p class="font-medium text-default">
              {{ account.label }}
            </p>
            <p>{{ account.description }}</p>
          </li>
        </ul>
      </UCard>
    </div>
  </UContainer>
</template>
