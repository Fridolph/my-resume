<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const route = useRoute()
const toast = useToast()
const { login, mockUsers } = useAuth()

const form = reactive({
  email: 'admin@fridolph.local',
  password: 'admin123'
})
const loading = ref(false)

const demoAccounts = computed(() =>
  mockUsers.map(user => ({
    label: `${user.name} · ${user.role}`,
    description: `${user.email} / ${user.password}`
  }))
)

async function handleSubmit() {
  loading.value = true

  try {
    await login(form.email, form.password)
    toast.add({
      title: '登录成功',
      description: '已进入管理后台。',
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
            <UBadge label="P5-1 角色模型预演" variant="subtle" color="primary" class="w-fit" />
            <h1 class="text-3xl font-bold text-highlighted">
              登录到 Fridolph Admin
            </h1>
            <p class="text-sm text-muted">
              当前阶段先用本地演示账号验证统一角色与权限模型，下一步再接入 `api-server` 真实鉴权服务。
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
            <span class="text-sm text-muted">登录后可访问首页、用户页、文案页与设置页。</span>
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
