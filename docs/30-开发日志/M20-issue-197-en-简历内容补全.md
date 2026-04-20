# M20 Issue 197 - EN 简历内容补全（关键词与时间展示）

## 背景
- 英文公开页仍存在中文内容残留：技能词云/结构化关键词和时间字段中的 `至今`
- 影响英文版一致性与教程学习体验

## 本次目标
- 在不改后端协议和简历 schema 的前提下，补齐 EN 展示缺口
- 保持现有数据结构兼容并可小步回滚

## 实际改动
- `packages/utils/src/date.ts`
  - `formatDateRange` 新增可选 `locale` 参数
  - EN 下将相对时间值 `至今/目前/现在` 映射为 `Present`
  - ZH 下将 `present/current/ongoing` 映射为 `至今`
- `apps/web/app/[locale]/_resume/*-section.tsx`
  - 教育/经历/项目区统一改为 `formatDateRange(item, locale)`
- `apps/web/app/[locale]/_resume/published-resume-skills-utils.ts`
  - 新增 EN 技能关键词直译表与短语兜底替换
  - `normalizeSkillGroups` 新增 `locale` 入参，EN 下优先输出英文关键词文本
- `apps/web/app/[locale]/_resume/published-resume-skills-section.tsx`
  - 调整为 `normalizeSkillGroups(skills, locale)`
- 测试补充
  - `packages/utils/src/index.spec.ts`
  - `apps/web/app/[locale]/_resume/__tests__/published-resume-skills-utils.spec.ts`

## Review 记录
- 方案采用“展示层 locale 兜底”而非 schema 大改，符合当前教程节奏
- 改动范围聚焦在 web + utils，不扩张到 server 接口层

## 遇到的问题
- 当前环境 `gh` 未在 PATH 中，但 `/opt/homebrew/bin/gh` 可用
- 沙箱默认无外网，创建 Issue 需升级网络权限

## 测试与验证
- 已执行：
  - ✅ `pnpm --filter @my-resume/utils typecheck`
  - ✅ `cd apps/web && ../../node_modules/.bin/tsc --noEmit --incremental false`
- 受环境影响暂未通过：
  - ⚠️ `pnpm --filter @my-resume/utils test`（`@rollup/rollup-darwin-arm64` 本地签名问题）
  - ⚠️ `pnpm --filter @my-resume/web typecheck`（`@next/swc-darwin-arm64` 本地签名问题）
- 手工验证建议：`/en` 下技能区和时间区是否已英文化

## 后续教程切入点
- 服务端渲染项目里“数据 schema 不变”的前提下，如何在展示层做 locale 兜底
- 技能词云这类非结构化文案的渐进式国际化策略
