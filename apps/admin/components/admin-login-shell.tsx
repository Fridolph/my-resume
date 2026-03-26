'use client';

import { DisplaySectionIntro, DisplaySurfaceCard } from '@my-resume/ui/display';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { fetchCurrentUser, loginWithPassword } from '../lib/auth-api';
import { AuthUserView } from '../lib/auth-types';
import { DEFAULT_API_BASE_URL } from '../lib/env';
import { readAccessToken, writeAccessToken } from '../lib/session-storage';
import { LoginForm } from './login-form';
import { ThemeModeToggle } from './theme-mode-toggle';

export function AdminLoginShell() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUserView | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const accessToken = readAccessToken();

    if (!accessToken) {
      setCheckingSession(false);
      return;
    }

    fetchCurrentUser({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
    })
      .then((user) => {
        setCurrentUser(user);
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setCheckingSession(false);
      });
  }, []);

  async function handleLogin(values: { username: string; password: string }) {
    setPending(true);
    setErrorMessage(null);

    try {
      const loginResult = await loginWithPassword({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        username: values.username,
        password: values.password,
      });

      writeAccessToken(loginResult.accessToken);
      setCurrentUser(loginResult.user);
      router.push('/dashboard');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '登录失败，请稍后重试',
      );
    } finally {
      setPending(false);
    }
  }

  if (checkingSession) {
    return (
      <DisplaySurfaceCard className="card">正在检查登录状态...</DisplaySurfaceCard>
    );
  }

  return (
    <main className="page-shell">
      <LoginForm
        errorMessage={errorMessage}
        onSubmit={handleLogin}
        pending={pending}
      />

      <DisplaySurfaceCard className="card stack">
        <div className="page-header">
          <DisplaySectionIntro
            className="page-header-copy"
            eyebrow="当前说明"
            title="最小后台登录说明"
          />
          <ThemeModeToggle />
        </div>
        <ul className="muted-list">
          <li>业务逻辑继续只走 `apps/server`，不写 Next Route Handlers 业务接口。</li>
          <li>本页只负责采集登录信息、发起请求、保存 token、跳转后台壳。</li>
          <li>当前 demo 账号：`admin / admin123456`、`viewer / viewer123456`。</li>
        </ul>

        {currentUser ? (
          <div className="status-box">
            <p>
              已检测到登录状态：<strong>{currentUser.username}</strong>（
              {currentUser.role}）
            </p>
            <Link className="link-button" href="/dashboard">
              前往受保护页面壳
            </Link>
          </div>
        ) : null}
      </DisplaySurfaceCard>
    </main>
  );
}
