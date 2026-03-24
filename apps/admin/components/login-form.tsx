'use client';

import { FormEvent, useState } from 'react';

interface LoginFormProps {
  pending: boolean;
  errorMessage: string | null;
  onSubmit: (values: { username: string; password: string }) => Promise<void>;
}

export function LoginForm({
  pending,
  errorMessage,
  onSubmit,
}: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      username,
      password,
    });
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="stack">
        <div>
          <p className="eyebrow">my-resume admin</p>
          <h1>后台最小登录壳</h1>
          <p className="muted">
            当前阶段只承接登录和登录态校验，后续再继续接内容管理。
          </p>
        </div>

        <label className="field">
          <span>用户名</span>
          <input
            autoComplete="username"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="admin / viewer"
            value={username}
          />
        </label>

        <label className="field">
          <span>密码</span>
          <input
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            type="password"
            value={password}
          />
        </label>

        {errorMessage ? (
          <p aria-live="polite" className="error-text">
            {errorMessage}
          </p>
        ) : null}

        <button disabled={pending} type="submit">
          {pending ? '登录中...' : '登录后台'}
        </button>
      </div>
    </form>
  );
}
