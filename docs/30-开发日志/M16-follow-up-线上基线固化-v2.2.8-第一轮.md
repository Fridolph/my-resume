# M16 Follow-up：线上基线固化（v2.2.8 第一轮）

## 背景

- 截至 2026-04-20，生产环境已切换到 `v2.2.8`。
- 当前目标是先完成“第一轮基线固化”，为后续性能优化提供可对比的统一参照。

## 本次目标

- 固化线上发布状态（版本、容器、健康状态）。
- 固化首轮性能基线（页面可达、首刷/热刷、关键 API）。
- 明确下一轮优化前必须保持不变的采样方式。

## 当前只做什么

- 记录“线上真实运行状态 + 首轮采样数据”。
- 不改业务代码，不改部署架构。

## 当前明确不做什么

- 不在本轮内做 Lighthouse 指标追高。
- 不在本轮内做包体或代码层优化改动。

## 采样时间与环境

- 采样日期：2026-04-20
- 采样版本：`v2.2.8`
- 采样对象：
  - `https://resume.fridolph.top`
  - `https://api-resume.fridolph.top`

## 发布状态基线（ECS）

- `current` 软链：
  - `/root/my-resume/.deploy-runtime/release-snapshots/v2.2.8`
- 线上容器：
  - `fridolph-top-web-1` → `my-resume-web:v2.2.8`（healthy）
  - `fridolph-top-admin-1` → `my-resume-admin:v2.2.8`（healthy）
  - `fridolph-top-server-1` → `my-resume-server:v2.2.8`（healthy）
- 本机探活：
  - `http://127.0.0.1:5577/api` ✅
  - `http://127.0.0.1:5555/` ✅
  - `http://127.0.0.1:5566/login` ✅

## 线上页面可达性基线（脚本）

- 命令：
  - `node scripts/perf-dev-route.mjs --target web-prod-v228 --base-url https://resume.fridolph.top --routes /zh,/en,/zh/profile,/zh/ai-talk --output .tmp/perf/prod-web-baseline-v2.2.8-2026-04-20.json`
- 结果：
  - `/zh`：`firstReachableAfterMs=189`，`warmResponseMs=93`
  - `/en`：`firstReachableAfterMs=54`，`warmResponseMs=58`
  - `/zh/profile`：`firstReachableAfterMs=58`，`warmResponseMs=77`
  - `/zh/ai-talk`：`firstReachableAfterMs=81`，`warmResponseMs=132`

## 关键接口与首页 TTFB 快速采样（curl 5 次）

- `resume /zh`
  - `ttfb` 区间：`0.053s ~ 0.191s`
  - `total` 区间：`0.087s ~ 0.228s`
- `api /api`
  - `ttfb` 区间：`0.043s ~ 0.261s`
  - `total` 区间：`0.043s ~ 0.261s`
- `api /api/resume/published`
  - `ttfb` 区间：`0.059s ~ 0.127s`
  - `total` 区间：`0.059s ~ 0.127s`

> 说明：首个请求通常包含冷启动/连接建立开销，后续请求更接近稳态。

## 运维资源基线

- 清理后磁盘：
  - `/dev/vda3` 使用率从 `83%` 降到 `65%`（可用约 `14G`）
- 当前 `docker system df`：
  - Images：`5.086GB`
  - Build Cache：`2.654GB`（可按需进一步清理）

## 本轮结论

- `v2.2.8` 已稳定运行，可作为后续优化对比基线版本。
- 关键链路可用性正常，线上接口响应在当前采样窗口内表现稳定。
- 下轮可进入“Lighthouse 固定条件采样 + 指标预算定义 + 单变量优化实验”。

## 下一步（第二轮基线固化建议）

1. 固定 Lighthouse 采样条件（无痕、同网络、同时间窗、连续 3 次取中位数）。
2. 固定路由清单：`/zh`、`/zh/profile`、`/zh/ai-talk`。
3. 固定 API 采样：`/api`、`/api/resume/published`（记录 p50/p95）。
4. 输出对比表模板（优化前/后）并纳入后续每个性能 Issue 的验收项。

## 第二轮补充（2026-04-20）

### Lighthouse（`/zh` 连续 3 次）

- 数据源：
  - `.tmp/perf/lh-v228-run1.json`
  - `.tmp/perf/lh-v228-run2.json`
  - `.tmp/perf/lh-v228-run3.json`
- 中位数：
  - Performance：`86`
  - Accessibility：`100`
  - Best Practices：`96`
  - SEO：`100`
  - FCP：`1.428s`
  - LCP：`3.769s`
  - Speed Index：`4.162s`
  - TBT：`42ms`
  - CLS：`0`

### 第二轮主要问题

- `Best Practices` 未满分的唯一稳定项：
  - `errors-in-console`（3 次均出现）
  - 具体为 `Minified React error #418`（文本 hydration mismatch）
- 机会项（3 次都出现）：
  - `modern-image-formats`
  - `uses-responsive-images`
  - `render-blocking-resources`（CSS 阻塞）

### HTTP 稳态采样（30 轮 / 90 条）

- 数据源：
  - `.tmp/perf/http-baseline-v228-2026-04-20.ndjson`
  - `.tmp/perf/http-baseline-v228-2026-04-20-summary.json`
- 关键指标：
  - `resume /zh`：TTFB `p50=80.8ms` / `p95=274.4ms`，Total `p50=132.7ms` / `p95=440.2ms`
  - `api /api`：TTFB `p50=67.1ms` / `p95=282.4ms`
  - `api /api/resume/published`：TTFB `p50=100.1ms` / `p95=289.1ms`

## 第三轮补充（2026-04-20，修复 API 报错后）

### 本地构建基线（`pnpm run perf:build:analyze`）

- 数据源：
  - 最新：`.tmp/perf/build-report.json`（`2026-04-20T09:24:56.243Z`）
  - 上轮：`.tmp/perf/build-report-latest.json`（`2026-04-17T12:07:59.703Z`）
  - 对比结果：`.tmp/perf/build-compare-v228-r3.json`

### Build 对比结论

- `web` 静态资源总量：
  - `1952238B -> 1964145B`（`+11907B`，约 `+11.6KiB`）
- `admin` 静态资源总量：
  - `2081274B -> 2076860B`（`-4414B`，约 `-4.3KiB`）
- 说明：
  - 总体体积基本持平，变动在可接受范围；
  - 仍需重点关注 `web` 的 `static/chunks/764.*.js`（约 `452.55KiB`）与 `admin` 主 CSS（约 `441.54KiB`）。

### Next build 首屏链路变化（关键收益）

- `web /[locale]` First Load JS：
  - `219kB -> 178kB`（明显下降）
- `web /[locale]/ai-talk*` 系列：
  - `207~208kB -> 167~168kB`（明显下降）
- `admin /dashboard`：
  - `169kB -> 151kB`（下降）

> 结论：这轮修复后，`web` 首屏与主要业务路由首包有明确收敛，符合“先控主链路体感”的目标。

### 第三轮加固判断

- ✅ 线上可用性：已恢复并稳定
- ✅ 性能基线：已有 Lighthouse + HTTP p50/p95 + Build 体积三层证据
- ✅ 可教学性：具备“问题 -> 修复 -> 指标变化”闭环材料
- ⏭️ 下一步：进入“单变量优化实验”（图片格式/响应式尺寸、CSS 阻塞收敛、console error 归零验证）
