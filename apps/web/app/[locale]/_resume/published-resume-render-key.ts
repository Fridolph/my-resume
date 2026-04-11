function normalizeRenderKeyPart(value: null | number | string | undefined): string {
  const normalizedValue = String(value ?? '')
    .trim()
    .replace(/\s+/gu, '-')

  return normalizedValue || 'empty'
}

export function createRenderKey(parts: Array<null | number | string | undefined>): string {
  return parts.map(normalizeRenderKeyPart).join('__')
}

export function createIndexedRenderKey(
  index: number,
  parts: Array<null | number | string | undefined>,
): string {
  return createRenderKey([...parts, index])
}
