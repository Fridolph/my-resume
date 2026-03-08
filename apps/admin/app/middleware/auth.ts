export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, refreshSession } = useAuth()

  await refreshSession()

  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})
