import type { AppLocale } from './locale'

export interface LocalizedTextLike<TValue = string> {
  zh: TValue
  en: TValue
}

export function readLocalizedText<TValue>(
  value: LocalizedTextLike<TValue>,
  locale: AppLocale,
): TValue {
  return value[locale]
}
