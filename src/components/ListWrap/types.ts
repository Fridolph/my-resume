export interface ListWrapProps {
  title: string
  type: 'dl' | 'ul',
  list: string[]
  bold?: boolean
  inner?: boolean
  titleSize?: 'base' | 'sm' | 'lg' | 'xl' | '2xl' | '3xl'
}