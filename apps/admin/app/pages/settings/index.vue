<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { hasPermission } = usePermissions()

if (!hasPermission('site.write')) {
  await navigateTo('/unauthorized')
}
</script>

<template>
  <UContainer class="py-10">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-highlighted">
            站点设置
          </h1>
          <p class="text-sm text-muted">
            当前页面仅管理员可访问，用于验证角色与权限表示方式。
          </p>
        </div>
      </template>

      <p class="text-sm text-muted">
        当前页面需要 `site.write` 权限才能访问。
      </p>
    </UCard>
  </UContainer>
</template>
