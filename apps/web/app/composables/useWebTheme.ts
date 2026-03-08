import type { ThemePreference } from '@repo/types'

const themeOptions = [
  { labelKey: 'theme.system', value: 'system' },
  { labelKey: 'theme.light', value: 'light' },
  { labelKey: 'theme.dark', value: 'dark' }
] satisfies Array<{ labelKey: string, value: ThemePreference }>

export function useWebTheme() {
  const colorMode = useColorMode()
  const themeCookie = useCookie<ThemePreference>('web-theme', {
    default: () => 'system'
  })
  const preference = useState<ThemePreference>('web-theme-preference', () => themeCookie.value ?? 'system')
  const { t } = useWebLocale()

  onMounted(() => {
    const storedPreference = localStorage.getItem('web-theme') as ThemePreference | null

    if ((storedPreference === 'system' || storedPreference === 'light' || storedPreference === 'dark') && storedPreference !== preference.value) {
      setThemePreference(storedPreference)
      return
    }

    colorMode.preference = preference.value
  })

  function setThemePreference(value: ThemePreference) {
    preference.value = value
    themeCookie.value = value
    colorMode.preference = value
    if (import.meta.client) {
      localStorage.setItem('web-theme', value)
    }
  }

  const currentThemeLabel = computed(() => t(`theme.${preference.value}`))
  const localizedThemeOptions = computed(() => {
    return themeOptions.map(option => ({
      value: option.value,
      label: t(option.labelKey)
    }))
  })

  return {
    preference,
    currentThemeLabel,
    localizedThemeOptions,
    setThemePreference
  }
}
