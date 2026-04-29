# M20 Issue 213 - CHANGELOG 与发布记录自动化首版

## 背景

仓库已经具备：

- `development -> main -> tag -> deploy` 的发布节奏
- ECS image 模式发布脚本
- `gh` / GitHub Actions / tag 驱动的基础能力

但缺少一层统一的变更说明沉淀：

- `CHANGELOG.md` 没有正式建立
- GitHub Release notes 没有固定生成入口
- 版本差异识别依赖人工对比 tag

## 本次目标

- 为仓库建立首版 `CHANGELOG.md`
- 增加基于 tag diff 的 release notes 生成脚本
- 增加创建 GitHub Release 的统一入口
- 为后续发布动作补一份清晰文档

## 方案对比

### Changesets

- 优点：成熟、monorepo 友好、适合 package version bump
- 不足：对当前“应用部署型 monorepo”偏重，需要 changeset 文件参与日常开发

### release-please

- 优点：Release PR + tag + GitHub Release 自动化强
- 不足：更贴近默认分支自动发布，不完全贴合当前 `development -> main -> tag` 节奏

### conventional-changelog

- 优点：最接近“按提交生成 changelog”
- 不足：默认更依赖 package version / preset 语义，而当前仓库版本真相来自 Git tag

## 最终落地

首版没有强行接入上述方案之一，而是采用 **tag-first release wrapper**：

- 以 Git tag 为版本来源
- 以 `git log previous-tag..target-ref` 为差异来源
- 以 commit title 做分组
- 同一份 Markdown 同时服务：
  - `CHANGELOG.md`
  - GitHub Release notes

## 实际改动

- 新增：`CHANGELOG.md`
- 新增：`scripts/release/lib.mjs`
- 新增：`scripts/release/changelog.mjs`
- 新增：`scripts/release/github-release.mjs`
- 新增根脚本：
  - `pnpm changelog:preview`
  - `pnpm changelog:write`
  - `pnpm release:notes`
  - `pnpm release:github`
- 新增文档：
  - `docs/20-研发流程/10-版本发布与-CHANGELOG-流程.md`

## Review 记录

- 评估重点不是“哪家工具最流行”，而是是否贴合当前 Git Flow
- 发现根 `package.json` 的 `version` 与最新 tag 不严格同步，直接套 package-version 型工具会产生偏差
- 因此首版优先保证“tag 差异识别”和“发布说明一致性”

## 遇到的问题

- 直接验证 `conventional-changelog` 时，默认版本标题会读取根 `package.json` 的 `version`
- 当前仓库实际发布版本依赖 Git tag，因此需要显式把“tag 才是真正版本号”固定下来

## 测试与验证

- 本地执行 `pnpm changelog:preview`
- 本地执行 `pnpm changelog:write`
- 本地执行 `pnpm release:notes`
- 本地执行 `pnpm release:github -- --tag <existing-tag> --draft` 的命令路径校验

## 后续可写成教程 / 博客的切入点

- 为什么“应用部署型 monorepo”不一定适合直接套 npm 包发布工具
- 如何围绕 `development -> main -> tag -> release` 建一套轻量 changelog 机制
- 如何让 `CHANGELOG.md` 与 GitHub Release notes 共用同一份版本说明
