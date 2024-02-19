export interface ListWrapProps {
  title?: string
  type: 'ul' | 'dl',
  list: string[]
  bold?: boolean
  inner?: boolean
  titleSize?: 'base' | 'sm' | 'lg' | 'xl' | '2xl' | '3xl'
}