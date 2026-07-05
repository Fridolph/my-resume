# M40 Tailwind v4 迁移修复 — Issue 草案

> 关联里程碑：M40（Tailwind 样式迁移）
> 状态：✅ 已完成

---

## issue-01 CSS Modules 残留语法修复（:global / "use client"）

- **背景**：M40 将 `.module.css` 改为 `.css` 后，遗留了三类语法错误
- **目标**：修复所有编译期 CSS/TSX 错误
- **改动范围**：
  - `apps/admin/` — `login-shell.css`（:global）、`login-form.tsx`（"use client"）、`admin-shell.css`（@tailwind）
  - `apps/web/` — `hero.css` / `skills-section.css` / `section-card.css` / `card-surface.css` / `entry-shell.css`（:global）
  - `apps/web/` — 4 个 `_resume/*.tsx`（"use client"）
  - `apps/web/` — `hero.module.css` 误引用修复 → `hero.css`
- **验收**：admin + web `next build` 通过，dev server HTTP 200

---

## issue-02 login-shell.css 类名与 TSX 对齐

- **背景**：`login-shell.css` 类名保留了 CSS Modules 编译产物的 `-L` 中缀（如 `.login-story-LPanel`），与 TSX 的 `className="login-story-panel"` 不匹配
- **目标**：32 个 CSS 类名全部对齐 TSX
- **改动**：
  - 移除所有 `-L` 中缀（`-LPanel` → `-panel`，共 20 种模式）
  - `.login-page` → `.login-login-page`（补全前缀）
  - `translate-LY` → `translateY`
- **验收**：`/login` 页面样式恢复

---

## issue-03 web Header 主导航恢复

- **背景**：`site-header.tsx` 在之前的 merge 中丢失了 `primaryNavWrapper` 导航栏（Resume / Profile / AI Talk 链接），grid 也从 3 列缩为 2 列
- **目标**：恢复桌面端主导航
- **改动**：
  - 恢复 `navItems` 常量
  - 恢复主导航 JSX（`primaryNavWrapper` + `primaryNavLink` + active 高亮）
  - grid 从 `md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]` → `...[auto]...`
- **验收**：web build + dev HTTP 200

---

## 遗留

- `admin-shell.css` 中的 `@import 'tailwindcss'` 引入方式是否会导致重复输出，后续可验证 Tailwind v4 的 CSS 去重行为
