# M16 Follow-up：性能优化专题（线上基线与 Issue 规划）

## 背景

- 项目已完成上线，公开站生产域名为：`https://resume.fridolph.top/zh`
- 本轮目标是开启“性能优化专题”，按 Issue 小步推进，并沉淀可复用教程材料。
- 依据仓库协作约定：开发从 `development` 分支出发，`main` 作为发布分支使用。

## 本次目标

- 同步 `main` 与 `development` 到最新状态。
- 从 `development` 切出性能专题开发分支。
- 查看 GitHub 最新 milestone / issue 列表，评估 M16 是否适合继续承接性能专题。
- 先记录线上环境“首次刷新时间”作为基线。

## 当前只做什么

- 只做“基线记录 + 规划准备”，不进入具体性能优化实现。

## 当前明确不做什么

- 不在本次记录中改动业务代码。
- 不扩展到 M21/M22 正在进行中的 RAG / AI Chat 功能开发。

## 分支与同步记录（2026-04-17）

- 当前本地分支同步过程：
  1. `git fetch --all --prune`
  2. `main` 快进同步 `origin/main`
  3. `development` 快进同步 `origin/development`
  4. `development` 尝试快进合并 `origin/main`（结果：已是最新）
- 新建专题分支：`fys-dev/feat-m16-perf-topic-baseline`

## GitHub 状态快照（2026-04-17）

### Milestone 状态

- 打开中的 milestone：
  - `M21 RAG 可解释问答最小闭环`
  - `M22 AI Chat 流式交互与会话体验`
- `M16 app-local 收口与共享能力基线` 当前为 `closed`，已关闭 issue：
  - #165
  - #166
  - #167

### 结论建议

- 若坚持“性能专题归档到 M16 语义”，建议采用 **M16 follow-up issue** 的记录方式，并视情况重新打开 M16 milestone。
- 若希望里程碑节奏更清晰，建议新开独立里程碑（如 M23：性能优化专题），避免与已收口里程碑混淆。

## 线上首次刷新时间基线（2026-04-17）

### 采集方式 A（仓库脚本）

- 命令：
  - `node scripts/perf-dev-route.mjs --target web-prod --base-url https://resume.fridolph.top --routes /zh --output .tmp/perf/prod-web-first-refresh.json`
- 结果：
  - `firstReachableAfterMs = 178ms`
  - `firstResponseMs = 178ms`
  - `warmResponseMs = 74ms`
  - `status = 200`

### 采集方式 B（curl 三次快速采样）

- 命令：
  - `curl -L -o /dev/null -s -w 'ttfb=%{time_starttransfer}s total=%{time_total}s code=%{http_code}\n' https://resume.fridolph.top/zh`
- 结果：
  - run-1: `ttfb=0.056183s` `total=0.082048s`
  - run-2: `ttfb=0.048751s` `total=0.071626s`
  - run-3: `ttfb=0.079036s` `total=0.098479s`

> 说明：上述值用于“当前轮次对比基线”，受采集点网络与时间段影响，后续需固定采样窗口与地域进行纵向对比。

## 后续 Issue 拆解（草案）

1. 性能指标与预算定义（CWV、TTFB、API p95、构建包体）
2. 基线采集与报告落盘（线上 + 预发 + 本地）
3. 单点优化实验（一次只改一个变量，保留前后对比）
4. 回归守门（CI 接入 LHCI / 压测阈值 / 报告沉淀）

## P0 快速修复记录：Mixed Content（2026-04-17）

### 现象

- Lighthouse Best Practices 报告出现 Mixed Content：
  - `http://server:5577/api/resume/published`

### 根因

- `apps/web/app/_core/env.ts` 里 `DEFAULT_API_BASE_URL` 优先读取 `RESUME_API_BASE_URL`。
- 在生产镜像中，`RESUME_API_BASE_URL` 常配置为容器内地址 `http://server:5577`（用于 SSR）。
- 该值被传入客户端组件后，浏览器会直接请求 `http://server:5577`，在 HTTPS 页面下触发 Mixed Content 并被拦截。

### 本次改动

- 将 `web` API 基址拆分为：
  - `DEFAULT_PUBLIC_API_BASE_URL`（客户端默认）
  - `DEFAULT_SERVER_API_BASE_URL`（服务端读取）
  - `DEFAULT_API_BASE_URL`（别名到 public，确保浏览器安全）
- 公开站 server page 的数据获取改为显式使用 `DEFAULT_SERVER_API_BASE_URL`，避免影响 SSR 内部链路。
- 新增环境变量回归测试，防止后续再次把 `RESUME_API_BASE_URL` 暴露到浏览器请求。

### 预期结果

- 生产 HTTPS 页面不再发起 `http://server:5577` 请求。
- Lighthouse Best Practices 的 Mixed Content 项应恢复正常。

## P0-2 方向验证：TBT / Unused JS（2026-04-17）

### 来自 Lighthouse JSON 的关键信号

- `TBT = 955ms`
- `Max Potential FID = 852ms`
- 主线程时间中 `Script Evaluation` 占比最高（约 49%）

### 仓库内构建产物快速归因（基于现有 .next 产物）

- 通过 `node scripts/perf-build-analyze.mjs --apps web,admin --output .tmp/perf/build-report-latest.json` 采集：
  - `apps/web` 静态产物约 `1906.48 KiB`
  - 首页路由 `'/[locale]/page'` 关联 chunk 体积约 `712.71 KiB`
  - 多路由共享的大 chunk 主要集中在：
    - `static/chunks/504-*.js`（`191.34 KiB`）
    - `static/chunks/c32fffbd-*.js`（`168.97 KiB`）
    - `static/chunks/748-*.js`（`168.94 KiB`）
- 另外 `764.*.js`（约 `452.55 KiB`）主要来自技能图表动态块，不是首页主路由首批 chunk。

### 本轮锁定的首个优化切口

- `apps/web/app/web-locale-providers.tsx` 存在 `@heroui/react` 根入口导入：
  - `import { I18nProvider } from '@heroui/react'`
- 根入口导入会把不必要模块拉入共享 chunk，放大主包执行成本。
- 已改为更细粒度入口：
  - `import { I18nProvider } from '@heroui/react/rac'`

### 第二轮尝试（资源加载 + 交互流畅度）

- `PublicSiteHeader` 移动端菜单改为按需动态加载：
  - 仅在移动端视口（`max-width: 639px`）或用户交互触发后加载菜单组件
  - 桌面端不再首批加载移动菜单逻辑，减少共享 JS 压力
- Hero 主头像资源调整加载优先级：
  - 正面头像改为 `loading=\"eager\" + fetchPriority=\"high\"`
  - 背面头像保持 `loading=\"lazy\" + fetchPriority=\"low\"`
- 目标：
  - 缩短 LCP 资源发现与请求延迟
  - 降低非必要 JS 首批执行开销，改善 TBT 与交互流畅性

### 当前阻塞

- 当前执行环境缺少可用 `npm/pnpm`，且本机原生模块签名问题导致 Next / Vitest 无法完成本地构建验证：
  - `@next/swc-darwin-arm64` / `@rollup/rollup-darwin-arm64` 加载失败
- 需在可正常安装依赖的环境重新构建后，复测体积与 Lighthouse 指标。

## 教程沉淀要求（本专题）

- 每个 Issue 都补开发日志，至少包含：
  - 背景
  - 本次目标
  - 实际改动
  - 遇到的问题（坑点）
  - 测试与验证
  - 对比结果（前后指标）
- 里程碑收口时整理专题教程，形成“方法 → 实操 → 踩坑 → 结果”的完整闭环。
