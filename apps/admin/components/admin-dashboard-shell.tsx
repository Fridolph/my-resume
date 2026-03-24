'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchCurrentUser } from '../lib/auth-api';
import { AuthUserView } from '../lib/auth-types';
import { DEFAULT_API_BASE_URL } from '../lib/env';
import {
  clearAccessToken,
  readAccessToken,
} from '../lib/session-storage';

export function AdminDashboardShell() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized'>(
    'loading',
  );
  const [currentUser, setCurrentUser] = useState<AuthUserView | null>(null);

  useEffect(() => {
    const accessToken = readAccessToken();

    if (!accessToken) {
      setStatus('unauthorized');
      return;
    }

    fetchCurrentUser({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
    })
      .then((user) => {
        setCurrentUser(user);
        setStatus('ready');
      })
      .catch(() => {
        clearAccessToken();
        setCurrentUser(null);
        setStatus('unauthorized');
      });
  }, []);

  if (status === 'loading') {
    return <main className="page-shell single-card">正在加载后台壳...</main>;
  }

  if (status === 'unauthorized' || !currentUser) {
    return (
      <main className="page-shell single-card">
        <section className="card stack">
          <div>
            <p className="eyebrow">未登录</p>
            <h1>请先登录后台</h1>
            <p className="muted">当前页面是最小受保护壳，需要先获取 JWT。</p>
          </div>
          <Link className="link-button" href="/">
            返回登录页
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell single-card">
      <section className="card stack">
        <div>
          <p className="eyebrow">受保护页面</p>
          <h1>后台最小控制台壳</h1>
          <p className="muted">
            这里只验证登录态与角色信息，内容管理功能放到后续 issue。
          </p>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span>用户名</span>
            <strong>{currentUser.username}</strong>
          </div>
          <div className="info-item">
            <span>角色</span>
            <strong>{currentUser.role}</strong>
          </div>
          <div className="info-item">
            <span>可编辑简历</span>
            <strong>{String(currentUser.capabilities.canEditResume)}</strong>
          </div>
          <div className="info-item">
            <span>可触发 AI</span>
            <strong>
              {String(currentUser.capabilities.canTriggerAiAnalysis)}
            </strong>
          </div>
        </div>

        <button
          onClick={() => {
            clearAccessToken();
            window.location.href = '/';
          }}
          type="button"
        >
          退出当前登录
        </button>
      </section>
    </main>
  );
}
