export const navButtonBaseClass =
  'group inline-flex min-h-[52px] w-full items-center justify-start gap-2.5 rounded-[16px] border border-transparent px-[0.55rem] py-1.5 text-[0.82rem] leading-none font-semibold text-zinc-500 transition-[background-color,color] duration-150 hover:bg-blue-50/85 hover:text-blue-700 dark:text-zinc-400 dark:hover:bg-blue-400/10 dark:hover:text-blue-100'
export const navButtonActiveClass =
  'bg-blue-50 text-blue-700 dark:bg-blue-400/12 dark:text-blue-100'
export const navButtonCollapsedClass =
  '!h-14 !w-14 !min-h-14 !min-w-14 !max-w-14 shrink-0 self-center justify-center items-center gap-0 rounded-[18px] bg-transparent !px-0 !py-0 hover:bg-transparent dark:hover:bg-transparent'
export const navBadgeBaseClass =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/75 text-current transition-[background-color,color,box-shadow] duration-150 dark:bg-white/[0.08]'
export const navBadgeCollapsedClass =
  '!h-11 !w-11 self-center justify-center rounded-[14px] bg-white/82 shadow-none group-hover:bg-blue-50/95 dark:bg-white/[0.08] dark:group-hover:bg-blue-400/12'
export const sidebarShellClass =
  'sticky top-0 hidden h-screen self-start md:block md:px-2 md:py-3'
export const sidebarHeaderClass = 'flex flex-col items-stretch gap-3 px-3 py-3 pb-2.5'
export const sidebarHeaderCollapsedClass = 'items-center px-2'
export const sidebarBrandClass = 'flex w-full items-center justify-between gap-2'
export const sidebarBrandCollapsedClass = 'flex-col justify-start gap-2.5'
export const sidebarToggleButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100 text-sm font-bold text-zinc-500 dark:border-white/8 dark:bg-white/[0.06] dark:text-zinc-300'
export const sidebarLogoClass =
  'flex h-12 w-12 items-center justify-center rounded-[18px] bg-zinc-900 text-[1.15rem] font-extrabold tracking-[-0.04em] text-white dark:bg-white dark:text-zinc-950'
export const sidebarContentClass =
  'flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-3 pb-4'
export const sidebarContentCollapsedClass = 'items-center px-0'
export const sidebarPanelClass =
  'flex h-full flex-col rounded-[24px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,247,251,0.9))] p-1 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.9))] dark:shadow-none'
export const headerPageMetaRowClass =
  'flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5 md:overflow-x-auto md:flex-nowrap md:gap-3 md:whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
export const headerPageBadgeClass =
  'inline-flex min-h-6 items-center rounded-full border border-blue-500/20 bg-blue-50 px-2.5 text-[0.72rem] font-bold tracking-[0.04em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300'
export const headerPageDescriptionClass =
  'm-0 text-[0.82rem] leading-[1.5] text-[#999] sm:text-[0.88rem] md:text-xs md:leading-[1.4]'
export const headerActionsClass = 'flex shrink-0 items-center justify-end gap-2 sm:gap-2.5'
export const headerShellClass =
  'sticky top-0 z-20 border-b border-zinc-200/70 bg-white/78 px-3 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/78 sm:px-4 sm:py-3 md:rounded-[28px] md:border md:px-5 lg:px-6'
export const headerBodyClass = 'flex items-start justify-between gap-3 sm:gap-4'
export const headerPrimaryContentClass = 'flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3'
export const headerTextStackClass = 'min-w-0 flex-1 space-y-1.5 sm:space-y-2'
export const headerSecondaryMetaClass = 'grid gap-1 sm:gap-1.5'
export const headerTitleClass =
  'text-[2rem] leading-none font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[2.15rem] md:text-2xl'
export const headerIconButtonClass =
  'inline-flex h-[30px] w-[30px] min-w-[30px] items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100/85 p-0 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-white/8 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
export const headerAvatarButtonClass =
  'inline-flex h-[30px] w-[30px] min-w-[30px] items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100/85 p-0 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-white/8 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
export const headerAvatarClass =
  'h-[22px] w-[22px] rounded-full bg-zinc-900 text-[0.66rem] font-bold text-white dark:bg-white dark:text-zinc-950'
export const sessionDropdownPopoverClass =
  'absolute right-0 top-[calc(100%+0.45rem)] z-30 min-w-[196px] rounded-[24px] border border-zinc-200/80 bg-white/96 p-3 shadow-[0_22px_48px_rgba(15,23,42,0.14)] transition duration-150 dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-[0_22px_48px_rgba(2,6,23,0.42)]'
export const sessionDropdownMenuClass = 'space-y-3'
export const sessionDropdownItemContentClass =
  'grid gap-0.5 rounded-[18px] border border-zinc-200/70 bg-zinc-50/90 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/80'
export const sessionDropdownItemLabelClass =
  'text-[0.68rem] font-medium tracking-[0.04em] text-zinc-500 dark:text-zinc-400'
export const sessionDropdownItemValueClass = 'text-[0.98rem] font-semibold text-zinc-950 dark:text-white'
export const sessionDropdownLogoutButtonClass =
  'inline-flex h-9 w-full items-center justify-center rounded-full border border-rose-200/80 bg-rose-50/90 px-3 text-[0.82rem] font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/15 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/16 dark:hover:text-rose-100'
export const mobileDrawerBackdropClass =
  'fixed inset-0 z-40 bg-zinc-950/35 backdrop-blur-[1px] transition-opacity duration-200'
export const mobileDrawerContentClass = 'fixed inset-y-0 left-0 z-50 w-[min(88vw,22rem)] md:hidden'
export const mobileDrawerDialogClass =
  'flex h-full w-full flex-col gap-4 border-r border-zinc-200/70 bg-white/95 px-4 py-4 shadow-2xl transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-950/95'
export const mobileDrawerCloseButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-zinc-100/90 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/8 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
