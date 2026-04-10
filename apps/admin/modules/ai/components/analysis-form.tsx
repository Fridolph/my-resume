'use client'

import { Button, ListBox, Select, TextArea } from '@heroui/react'

import { adminPrimaryButtonClass } from '@/core/button-styles'
import type { ReactNode } from 'react'

import type { AiWorkbenchLocale, AiWorkbenchScenario } from '../types/ai-workbench.types'
import { localeOptions, scenarioOptions } from '../utils/analysis-utils'

interface AnalysisFormProps {
  applyFeedbackMessage?: string | null
  applyPending: boolean
  content: string
  errorMessage?: string | null
  helperMessage?: string | null
  inputAccessory?: ReactNode
  locale: AiWorkbenchLocale
  moduleLinkMessage?: string | null
  onChangeLocale: (locale: AiWorkbenchLocale) => void
  onContentChange: (value: string) => void
  onGenerateSuggestion: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onUpdateScenario: (scenario: AiWorkbenchScenario) => void
  pending: boolean
  scenario: AiWorkbenchScenario
  suggestionErrorMessage?: string | null
  suggestionPending: boolean
}

export function AnalysisForm({
  applyFeedbackMessage,
  applyPending,
  content,
  errorMessage,
  helperMessage,
  inputAccessory,
  locale,
  moduleLinkMessage,
  onChangeLocale,
  onContentChange,
  onGenerateSuggestion,
  onSubmit,
  onUpdateScenario,
  pending,
  scenario,
  suggestionErrorMessage,
  suggestionPending,
}: AnalysisFormProps) {
  return (
    <div className="stack self-start">
      {inputAccessory ? <div className="stack">{inputAccessory}</div> : null}

      <form
        className="stack rounded-[1.75rem] border border-zinc-200/80 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"
        onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">
            <span>分析场景</span>
            <Select
              aria-label="分析场景"
              fullWidth
              onSelectionChange={(key) =>
                onUpdateScenario(String(key) as AiWorkbenchScenario)
              }
              selectedKey={scenario}
              variant="secondary">
              <Select.Trigger aria-label="分析场景">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {scenarioOptions.map((option) => (
                    <ListBox.Item
                      id={option.value}
                      key={option.value}
                      textValue={option.label}>
                      {option.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </label>

          <label className="field">
            <span>输出语言</span>
            <Select
              aria-label="输出语言"
              fullWidth
              onSelectionChange={(key) =>
                onChangeLocale(String(key) as AiWorkbenchLocale)
              }
              selectedKey={locale}
              variant="secondary">
              <Select.Trigger aria-label="输出语言">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {localeOptions.map((option) => (
                    <ListBox.Item
                      id={option.value}
                      key={option.value}
                      textValue={option.label}>
                      {option.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </label>
        </div>

        <label className="field">
          <span>分析输入</span>
          <TextArea
            className="min-h-[20rem] font-mono leading-6"
            fullWidth
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="可直接粘贴 JD、简历段落或 offer 信息；也可以先从上方文件提取区同步文本。"
            value={content}
            variant="secondary"
          />
        </label>

        {helperMessage ? (
          <div className="dashboard-inline-note">{helperMessage}</div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {suggestionErrorMessage ? (
          <p className="error-text">{suggestionErrorMessage}</p>
        ) : null}
        {moduleLinkMessage ? (
          <p className="dashboard-inline-note">{moduleLinkMessage}</p>
        ) : null}
        {applyFeedbackMessage ? (
          <p className="dashboard-inline-note">{applyFeedbackMessage}</p>
        ) : null}

        <div className="dashboard-entry-actions">
          <Button
            className={adminPrimaryButtonClass}
            isDisabled={pending}
            size="md"
            type="submit"
            variant="primary">
            {pending ? '正在生成分析...' : '开始真实分析'}
          </Button>
          <Button
            isDisabled={suggestionPending || applyPending}
            onClick={onGenerateSuggestion}
            size="md"
            type="button"
            variant="outline">
            {suggestionPending ? '正在生成建议稿...' : '生成结构化简历建议'}
          </Button>
        </div>
      </form>
    </div>
  )
}
