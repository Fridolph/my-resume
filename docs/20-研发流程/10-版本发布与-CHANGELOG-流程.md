# 版本发布与 CHANGELOG 流程

## 背景

当前仓库的正式发布节奏是：

1. issue 分支开发并合并回 `development`
2. 阶段收束后将 `development` 合并到 `main`
3. 在 `main` 上打 `v*` tag
4. 构建镜像、部署 ECS、创建 GitHub Release

这类流程的核心不是“发布 npm 包”，而是**识别上一个正式 tag 与当前发布 tag 之间的差异**，再把差异整理成：

- 仓库内可追溯的 `CHANGELOG.md`
- GitHub Release 页面可对外展示的更新说明

## 为什么这次没有直接接 Changesets / release-please / conventional-changelog

### Changesets

- 更适合“多 package 发布 / version bump / npm publish”场景
- 需要在 feature 分支里显式维护 changeset 文件
- 对当前仓库这种“应用部署型 monorepo + 手动 merge/tag/release”来说偏重

### release-please

- 更适合默认分支上的 release PR 驱动流程
- 会把“版本提案、tag、release”做成默认分支自动化主线
- 与当前 `development -> main -> tag -> deploy` 的节奏不完全同构

### conventional-changelog

- 是三个候选里最接近当前需求的方案
- 但它默认更依赖 package version / preset 语义，而当前仓库的真实版本来源是 Git tag
- 根 `package.json` 的 `version` 与发布 tag 并不总是同步，直接套 CLI 会导致标题 / compare link 偏差

## 本次首版方案

首版采用 **tag-first 的仓库内 release wrapper**：

- 以 Git tag 为唯一版本来源
- 以 `git log <previous-tag>..<target-ref>` 为差异输入
- 以 Conventional Commit 风格标题做分组
- 生成同一份 Markdown：
  - 可写入 `CHANGELOG.md`
  - 也可直接作为 GitHub Release notes

这让流程与当前仓库完全对齐，不要求重做分支与发布模式。

## 脚本入口

### 1. 预览本次发布 changelog

在 `main` 合并完成、准备打 tag 之前执行：

```bash
pnpm changelog:preview -- --tag v2.2.23
```

默认行为：

- `--to HEAD`
- 自动识别上一个 `v*` tag
- 输出本次版本的 Markdown 预览

也可以显式指定区间：

```bash
pnpm changelog:preview -- --tag v2.2.23 --from v2.2.22 --to HEAD
```

### 2. 写入仓库 CHANGELOG

```bash
pnpm changelog:write -- --tag v2.2.23
```

这一步会：

- 根据上一个 tag 到当前 `HEAD` 的 commit 差异生成新条目
- 追加 / 更新到根目录 `CHANGELOG.md`

推荐顺序：

1. `main` 上合并完成
2. 运行 `pnpm changelog:write -- --tag vX.Y.Z`
3. 提交 `CHANGELOG.md`
4. 再创建并 push `vX.Y.Z` tag

## 生成 GitHub Release notes 文件

如果只想先生成一份独立 Markdown：

```bash
pnpm release:notes -- --tag v2.2.23
```

默认输出到：

```bash
.tmp/release-notes/v2.2.23.md
```

如果是**已存在 tag**，也可以显式指定：

```bash
pnpm release:notes -- --tag v2.2.23 --to v2.2.23
```

## 创建 GitHub Release

当 tag 已经存在并推到远端后：

```bash
pnpm release:github -- --tag v2.2.23 --draft
```

默认行为：

- 校验本地 tag 是否存在
- 若未显式提供 notes 文件，则自动生成 `.tmp/release-notes/v2.2.23.md`
- 调用 `gh release create`

常见用法：

```bash
pnpm release:github -- --tag v2.2.23 --draft --title "v2.2.23"
```

## 推荐发布顺序

### 一键发布（推荐）

确保已完成 `development` 合并后，在 `main` 分支上执行：

```bash
pnpm release -- --tag v2.2.24 --ecs-host 1.2.3.4
```

这个命令自动完成：
1. 从上一个 tag 差异生成 CHANGELOG 并自动 commit
2. 创建 tag（如不存在）
3. 推送 `main` 和 tag 到远端
4. 构建并推送 Docker 镜像到镜像仓库
5. SSH 远程执行 `release.sh` 部署到 ECS
6. 创建 GitHub Release

常用变体：

```bash
# 预览模式（不实际执行）
pnpm release:dry -- --tag v2.2.24

# 仅构建推送镜像，不部署
pnpm release -- --tag v2.2.24 --skip-deploy

# 仅部署已存在的 tag（跳过构建）
pnpm release -- --tag v2.2.24 --skip-build --skip-changelog

# 跳过 GitHub Release
pnpm release -- --tag v2.2.24 --ecs-host 1.2.3.4 --skip-github
```

### 手工分步发布

如果需要更细粒度的控制：

```bash
git checkout main
git pull --ff-only origin main

# 1) 预览 CHANGELOG
pnpm changelog:preview -- --tag v2.2.23

# 2) 写入 CHANGELOG
pnpm changelog:write -- --tag v2.2.23
git add CHANGELOG.md
git commit -m "docs(changelog): prepare v2.2.23"

# 3) 打 tag 并推送
git tag -a v2.2.23 -m "release: v2.2.23"
git push origin main
git push origin v2.2.23

# 4) 构建并推送 Docker 镜像
./deploy/ecs/build-and-push-images.sh --tag v2.2.23 --image-prefix <registry>/<ns>/my-resume

# 5) 部署到 ECS
./deploy/ecs/release-from-local.sh --tag v2.2.23 --ecs-host 1.2.3.4 --skip-build

# 6) 创建 GitHub Release
pnpm release:github -- --tag v2.2.23 --draft --title "v2.2.23"
```

### 已经打过 tag，只补 GitHub Release

```bash
pnpm release:github -- --tag v2.2.23 --draft
```

## 当前约束

- 本方案依赖 commit title 尽量接近 Conventional Commit，例如：
  - `feat(web): ...`
  - `fix(server): ...`
  - `docs(m20): ...`
- 非标准标题不会丢失，但会进入“其他变更”
- 当前不自动回填历史版本 changelog
- 当前不自动发 release PR，不自动改 package version

## 后续可演进方向

- 为 squash merge 标题增加更严格的约束
- 在 CI 中加入 changelog dry-run 校验
- 在 tag push 后自动创建 GitHub Release
- 如果未来要进入真正的多 package 发布，可再评估 Changesets
