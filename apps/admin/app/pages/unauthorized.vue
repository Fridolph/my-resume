<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <UContainer class="py-16 sm:py-24">
    <UCard class="mx-auto max-w-2xl">
      <template #header>
        <div class="space-y-2">
          <UBadge label="403" color="error" variant="subtle" class="w-fit" />
          <h1 class="text-2xl font-bold text-highlighted">
            你没有访问该页面的权限
          </h1>
        </div>
      </template>

      <p class="text-muted">
        当前账号已登录，但不具备访问此页面的权限。你可以返回首页，或切换到更高权限的演示账号继续验证。
      </p>

      <template #footer>
        <div class="flex gap-3">
          <UButton to="/" label="返回首页" />
          <UButton to="/login" label="切换账号" color="neutral" variant="subtle" />
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
