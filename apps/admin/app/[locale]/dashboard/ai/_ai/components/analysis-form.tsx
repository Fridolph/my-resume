'use client'

import { Button, ListBox, Select, TextArea } from '@heroui/react'

import { adminPrimaryButtonClass } from '@core/button-styles'
import type { ReactNode } from 'react'

import type { ResumeDraftSummarySnapshot } from '../../../resume/_resume/types/resume.types'
import type { AiWorkbenchLocale, AiWorkbenchScenario } from '../types/ai-workbench.types'
import { localeOptions, scenarioOptions } from '../utils/analysis-utils'

interface AnalysisFormProps {
  applyFeedbackMessage?: string | null
  applyPending: boolean
  content: string
  draftSnapshot?: ResumeDraftSummarySnapshot | null
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
  draftSnapshot,
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
      <form
        className="stack rounded-[1.75rem] border border-zinc-200/80 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"
        onSubmit={onSubmit}>
        <section className="grid gap-4">
          <div className="grid gap-2">
            <p className="eyebrow">当前草稿优化</p>
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
              分析当前草稿并生成结构化建议
            </h3>
            <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              系统会直接读取后台当前草稿作为唯一优化基线。你只需要补充目标岗位、JD
              或优化要求，AI 会返回可勾选、可应用的模块变更。
            </p>
          </div>

          <div className="status-box">
            <strong>当前草稿基线</strong>
            {draftSnapshot ? (
              <>
                <span>{draftSnapshot.resume.profile.headline}</span>
                <span>{draftSnapshot.resume.profile.summary}</span>
                <span>
                  模块统计：经历 {draftSnapshot.resume.counts.experiences} / 项目{' '}
                  {draftSnapshot.resume.counts.projects} / 技能{' '}
                  {draftSnapshot.resume.counts.skills} / 亮点{' '}
                  {draftSnapshot.resume.counts.highlights}
                </span>
              </>
            ) : (
              <span>正在读取当前草稿快照，结构化建议会在草稿基线上生成。</span>
            )}
          </div>

          {inputAccessory ? (
            <div className="grid gap-3 rounded-[1.25rem] border border-dashed border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="grid gap-1">
                <strong className="text-sm font-semibold text-zinc-950 dark:text-white">
                  辅助参考材料
                </strong>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  可选：先从 PDF、Markdown 或文本里提取参考内容，再整理到下方优化要求中；但真正被改写的仍是当前草稿。
                </p>
              </div>
              <div className="stack">{inputAccessory}</div>
            </div>
          ) : null}

          <label className="field">
            <span>目标岗位 / JD / 优化要求</span>
            <TextArea
              className="min-h-[18rem] font-mono leading-6"
              fullWidth
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="例如：目标岗位是高级前端 / 全栈工程师，请结合这段 JD，优化我的个人定位、项目亮点和结果表达。"
              value={content}
              variant="secondary"
            />
          </label>

          {helperMessage ? (
            <div className="dashboard-inline-note">{helperMessage}</div>
          ) : null}
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
              isDisabled={suggestionPending || applyPending}
              onPress={onGenerateSuggestion}
              size="md"
              type="button"
              variant="primary">
              {suggestionPending ? '正在分析当前草稿...' : '分析当前草稿并生成建议'}
            </Button>
          </div>
        </section>

        <section className="grid gap-4 rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="grid gap-2">
            <p className="eyebrow">辅助分析报告</p>
            <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
              生成可阅读的分析结论
            </h3>
            <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              这一步不会直接改写草稿，适合先看岗位匹配、风险提示和行动建议，再决定是否进入结构化改写。
            </p>
          </div>

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

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

          <div className="dashboard-entry-actions">
            <Button
              isDisabled={pending || applyPending}
              size="md"
              type="submit"
              variant="outline">
              {pending ? '正在生成分析报告...' : '生成辅助分析报告'}
            </Button>
          </div>
        </section>
      </form>
    </div>
  )
}
