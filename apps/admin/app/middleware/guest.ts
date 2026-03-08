export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, refreshSession } = useAuth()

  await refreshSession()

  if (isAuthenticated.value) {
    return navigateTo('/')
  }
})
