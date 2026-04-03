'use client';

import { Button, Switch } from '@heroui/react';
import { useThemeMode } from '@my-resume/ui/theme';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { ResumeLocale } from '../lib/published-resume-types';
import { resumeLabels } from './published-resume/published-resume-utils';

interface PublicSiteHeaderProps {
  locale: ResumeLocale;
  onChangeLocale: (locale: ResumeLocale) => void;
}

const navItems = [
  {
    href: '/',
    key: 'resume',
  },
  {
    href: '/profile',
    key: 'profile',
  },
  {
    href: '/ai-talk',
    key: 'aiTalk',
  },
] as const;

export function PublicSiteHeader({
  locale,
  onChangeLocale,
}: PublicSiteHeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useThemeMode();
  const labels = resumeLabels[locale];

  return (
    <header className="sticky top-0 z-30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/78 px-4 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/82 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <Link className="inline-flex w-fit items-center gap-3" href="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-extrabold tracking-[-0.08em] text-white dark:bg-white dark:text-slate-950">
              FY
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                public site
              </span>
              <span className="text-lg font-semibold text-slate-950 dark:text-white">
                fridolph resume
              </span>
            </span>
          </Link>

          <nav className="flex flex-wrap gap-2" aria-label="Public site navigation">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  className={
                    isActive
                      ? 'inline-flex min-h-10 items-center rounded-full border border-blue-300 bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 dark:border-blue-400/40 dark:bg-blue-500 dark:text-slate-950'
                      : 'inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white/70 px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:text-blue-200'
                  }
                  href={item.href}
                  key={item.href}
                >
                  {item.key === 'resume'
                    ? labels.resumeNav
                    : item.key === 'profile'
                      ? labels.profileNav
                      : labels.aiTalkNav}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-slate-200 bg-white/75 p-1 dark:border-white/10 dark:bg-white/5">
            <Button
              className="min-w-[84px] rounded-full px-4"
              onClick={() => onChangeLocale('zh')}
              size="sm"
              type="button"
              variant={locale === 'zh' ? 'primary' : 'ghost'}
            >
              中文
            </Button>
            <Button
              className="min-w-[84px] rounded-full px-4"
              onClick={() => onChangeLocale('en')}
              size="sm"
              type="button"
              variant={locale === 'en' ? 'primary' : 'ghost'}
            >
              EN
            </Button>
          </div>

          <Switch
            aria-label="切换明暗主题"
            className="rounded-full border border-slate-200 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            isSelected={theme === 'dark'}
            onChange={(nextSelected) => setTheme(nextSelected ? 'dark' : 'light')}
            size="sm"
          >
            {theme === 'dark' ? labels.themeDark : labels.themeLight}
          </Switch>
        </div>
      </div>
    </header>
  );
}
