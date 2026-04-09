import {
  createElement,
  type AnchorHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

function joinClassNames(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(' ')
}

type DisplaySurfaceCardProps<T extends ElementType = 'section'> = {
  as?: T
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function DisplaySurfaceCard<T extends ElementType = 'section'>({
  as,
  children,
  className,
  ...restProps
}: DisplaySurfaceCardProps<T>) {
  const Component = (as ?? 'section') as ElementType

  return createElement(
    Component,
    {
      className: joinClassNames('display-surface-card', className),
      ...restProps,
    },
    children,
  )
}

interface DisplaySectionIntroProps<T extends ElementType = 'h2'> {
  compact?: boolean
  description?: ReactNode
  descriptionClassName?: string
  eyebrow?: ReactNode
  eyebrowClassName?: string
  title: ReactNode
  titleAs?: T
  className?: string
  titleClassName?: string
}

export function DisplaySectionIntro<T extends ElementType = 'h2'>({
  compact = false,
  description,
  descriptionClassName,
  eyebrow,
  eyebrowClassName,
  title,
  titleAs,
  className,
  titleClassName,
}: DisplaySectionIntroProps<T>) {
  const TitleComponent = (titleAs ?? 'h2') as ElementType

  return (
    <div
      className={joinClassNames(
        'display-section-intro',
        compact && 'is-compact',
        className,
      )}>
      {eyebrow ? (
        <p className={joinClassNames('eyebrow', eyebrowClassName)}>{eyebrow}</p>
      ) : null}
      {createElement(
        TitleComponent,
        { className: joinClassNames('display-section-title', titleClassName) },
        title,
      )}
      {description ? (
        <p
          className={joinClassNames('display-section-description', descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  )
}

type DisplayStatCardProps<T extends ElementType = 'article'> = {
  as?: T
  className?: string
  description?: ReactNode
  label: ReactNode
  value: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

export function DisplayStatCard<T extends ElementType = 'article'>({
  as,
  className,
  description,
  label,
  value,
  ...restProps
}: DisplayStatCardProps<T>) {
  const Component = (as ?? 'article') as ElementType

  return createElement(
    Component,
    {
      className: joinClassNames('display-stat-card', className),
      ...restProps,
    },
    <>
      <span className="display-stat-label">{label}</span>
      <strong className="display-stat-value">{value}</strong>
      {description ? <p className="display-stat-description">{description}</p> : null}
    </>,
  )
}

type DisplayPillBaseProps = {
  children: ReactNode
  className?: string
}

type DisplayPillLinkProps = DisplayPillBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    external?: boolean
    href: string
  }

type DisplayPillTextProps = DisplayPillBaseProps &
  HTMLAttributes<HTMLSpanElement> & {
    external?: never
    href?: undefined
  }

export function DisplayPill(props: DisplayPillLinkProps | DisplayPillTextProps) {
  const className = joinClassNames(
    'display-pill',
    'href' in props && props.href ? 'display-pill-link' : null,
    props.className,
  )

  if ('href' in props && props.href) {
    const { children, className: _className, external, rel, ...restProps } = props

    return (
      <a
        className={className}
        rel={external ? (rel ?? 'noreferrer') : rel}
        target={external ? '_blank' : undefined}
        {...restProps}>
        {children}
      </a>
    )
  }

  const { children, className: _className, ...restProps } = props

  return (
    <span className={className} {...restProps}>
      {children}
    </span>
  )
}
