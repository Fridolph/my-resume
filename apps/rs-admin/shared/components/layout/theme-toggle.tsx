'use client'

import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { useTheme } from '@shared/lib/theme/theme-context'

export function ThemeToggle() {
  const { mode, toggle } = useTheme()

  return (
    <Button
      type="text"
      aria-label={mode === 'light' ? '切换到暗色' : '切换到亮色'}
      icon={mode === 'light' ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggle}
    />
  )
}
