'use client'

import { Input } from 'antd'
import { useState } from 'react'

/**
 * 练习组件：受控输入 + 实时预览（U2 练习的**修正版**）。
 *
 * 对照 Q2 的原始写法，修正了 3 处：
 * 1. useState('') 给初值，避免受控/非受控切换
 * 2. onChange 只包一层箭头函数（原来多包了一层，导致事件没被正确接收）
 * 3. 取值用 e.target.value（不是 e.value）
 */
export function ResumeTitleEditor() {
  const [value, setValue] = useState('')

  return (
    <div className="space-y-3">
      <Input
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder="输入简历标题"
      />
      <p className="text-sm text-[var(--ant-color-text-secondary)]">
        当前标题：{value || '（空）'}
      </p>
    </div>
  )
}
