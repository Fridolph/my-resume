# ECS 部署脚本（支持 Build / Image 双模式）

本目录提供一套可复用的 ECS 部署脚本，默认支持两种模式：

- `build`：在 ECS 上 `docker compose --build`（兼容旧流程）
- `image`：ECS 只做 `pull + up`（推荐，尤其是 2核2G）

> 推荐你在生产使用 `image` 模式，把构建压力放到本地或 CI。

---

## 1. 目录说明

- `bootstrap.sh`：安装 Docker / Nginx / Certbot 并初始化部署目录
- `render-config.sh`：渲染 `.env`、`compose.prod.yml` 与 Nginx 配置
- `release.sh <tag>`：发布指定版本（自动识别 build/image）
- `pre-release-port-cleanup.sh`：发布前清理旧项目残留容器占用端口
- `pre-release-disk-cleanup.sh`：发布前检查 Docker 磁盘空间并按阈值自动清理
- `deploy-latest-tag.sh`：同步 `main`+标签后，自动发布最新 tag 并执行验收
- `rollback.sh [tag]`：回滚到上一版或指定 tag
- `build-and-push-images.sh`：本地构建并推送三端镜像（image 模式专用）
- `sync-base-image.sh`：同步基础镜像到私有仓库（降低 DockerHub 依赖风险）
- `stack-env-checklist.md`：`stack.env.local` 填写清单

模板目录：

- `deploy/templates/compose.prod.yml.tpl`（build 模式）
- `deploy/templates/compose.prod.image.yml.tpl`（image 模式）
- `deploy/templates/nginx*.tpl`
- `deploy/templates/stack.env.example`

---

## 2. 部署目录约定

默认部署根目录：

```bash
/opt/my-resume
```

关键结构：

```text
/opt/my-resume/
  .deploy-runtime/
    repo-cache/
    release-snapshots/<tag>/
    current -> release-snapshots/*
    shared/
      config/stack.env.local
      data/
      storage/rag/
      nginx/
      state/
```

---

## 3. 快速上手（服务器侧）

### 3.1 首次初始化

```bash
cd /opt/my-resume
./deploy/ecs/bootstrap.sh
```

### 3.2 填写运行配置

```bash
vim /opt/my-resume/.deploy-runtime/shared/config/stack.env.local
```

推荐重点配置：

```env
DEPLOY_MODE=image
IMAGE_REPOSITORY_PREFIX=ghcr.io/<your-user-or-org>/my-resume
```

更多字段见：`deploy/ecs/stack-env-checklist.md`

### 3.3 发布

```bash
cd /opt/my-resume
./deploy/ecs/release.sh v2.1.0
```

### 3.4 一键发布最新标签并验收

```bash
cd /opt/my-resume
DEPLOY_ROOT=/opt/my-resume ./deploy/ecs/deploy-latest-tag.sh
```

可选环境变量：

- `TARGET_BRANCH`：默认 `main`
- `TAG_PATTERN`：默认 `v*`（按语义版本排序取最新）
- `TAG_STRATEGY`：默认 `latest`
  - `latest`：严格使用最新 tag；若镜像仓库缺少该 tag 的 `server/web/admin` manifest，会直接失败
  - `latest-deployable`：在 image 模式下自动回退到“最新且三端镜像都存在”的 tag
- `SKIP_PUBLIC_CHECK=1`：仅做本机健康检查，不校验公网域名

---

## 4. Image 模式工作流（推荐）

### 4.0 先同步基础镜像到私有仓库（强烈推荐）

```bash
./deploy/ecs/sync-base-image.sh \
  --source-image node:22-slim \
  --target-repo crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node \
  --target-tag 22-slim \
  --stamp-tag 22-slim-20260421
```

在 `stack.env.local` 中配置：

```env
DEPLOY_BASE_IMAGE=crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim
```

### 4.1 本地构建并推送镜像

支持三种 tag 输入方式：

- 显式 `--tag v2.2.9`
- 显式 `--version 2.2.9`（会自动转成 `v2.2.9`）
- 自动 `--auto-tag`（从当前 `HEAD` 识别 `v*` tag）

```bash
./deploy/ecs/build-and-push-images.sh \
  --version 2.1.0 \
  --image-prefix ghcr.io/<your-user-or-org>/my-resume \
  --public-api-base-url https://api-resume.example.com \
  --web-server-api-base-url http://server:5577 \
  --services all \
  --platform linux/amd64
```

也支持显式三端镜像仓库（适合 server/web/admin 分仓）：

```bash
./deploy/ecs/build-and-push-images.sh \
  --tag v2.1.0 \
  --server-image <registry>/my-resume-server \
  --web-image <registry>/my-resume-web \
  --admin-image <registry>/my-resume-admin \
  --public-api-base-url https://api-resume.example.com \
  --web-server-api-base-url http://server:5577 \
  --services all \
  --platform linux/amd64
```

按服务选择构建（不变服务复用旧 tag）：

```bash
./deploy/ecs/build-and-push-images.sh \
  --tag v2.2.9 \
  --server-image <registry>/my-resume-server \
  --web-image <registry>/my-resume-web \
  --admin-image <registry>/my-resume-admin \
  --services web,admin \
  --reuse-from-tag v2.2.8 \
  --public-api-base-url https://api-resume.example.com \
  --web-server-api-base-url http://server:5577 \
  --platform linux/amd64
```

### 4.2 ECS 拉取并启动

`release.sh` 在 `DEPLOY_MODE=image` 下会自动执行：

1. `docker compose pull`
2. `docker compose up -d --no-build --remove-orphans`
3. 发布前自动清理旧 compose 项目占用端口（5577/5555/5566）

无需再 `--build`。

### 4.3 本地一键：版本对齐 + 构建推送 + ECS 发布

同样支持三种发布标识来源：

- 显式 `--tag`
- 显式 `--version`
- 自动 `--auto-tag`（当前提交必须已打 `v*` tag）

```bash
./deploy/ecs/release-from-local.sh \
  --version 2.2.4 \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain> \
  --ecs-user root \
  --ecs-port 22
```

说明：

- `--version 2.2.4` 会自动对齐为发布 tag `v2.2.4`
- 脚本会保证发布 tag 与镜像 tag 一致（默认 `IMAGE_TAG=v2.2.4` 语义）
- 自动创建 tag 前会强校验：必须在 `main`、工作区干净、且 `main` 与 `origin/main` 完全同步
- 若 tag 不存在，可自动创建并 push
- 本地先构建推送镜像，再通过 SSH 调 ECS `release.sh`
- 发布后默认会做公网域名健康检查（可加 `--skip-public-check`）
- 如遇 DockerHub 网络问题，建议把 `node:22-slim` 同步到你自己的仓库，并配置 `DEPLOY_BASE_IMAGE`
- 如遇 apt 源网络/证书问题，可配置 `DEPLOY_APT_DEBIAN_MIRROR_URL` 与 `DEPLOY_APT_SECURITY_MIRROR_URL`（不配置时使用 Debian 官方源）

自动识别当前 tag 的发布示例：

```bash
./deploy/ecs/release-from-local.sh \
  --auto-tag \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain>
```

#### 4.4 四种发布场景（推荐模板）

设：

- 旧版本：`v2.2.8`
- 新版本：`v2.2.9`

1) 仅升级 `server`（`web/admin` 复用旧版本）：

```bash
./deploy/ecs/release-from-local.sh \
  --version 2.2.9 \
  --services server \
  --reuse-from-tag v2.2.8 \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain>
```

2) 仅升级 `web`：

```bash
./deploy/ecs/release-from-local.sh \
  --version 2.2.9 \
  --services web \
  --reuse-from-tag v2.2.8 \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain>
```

3) 仅升级 `admin`：

```bash
./deploy/ecs/release-from-local.sh \
  --version 2.2.9 \
  --services admin \
  --reuse-from-tag v2.2.8 \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain>
```

4) 同时升级 `web + admin`（`server` 复用旧版本）：

```bash
./deploy/ecs/release-from-local.sh \
  --version 2.2.9 \
  --services web,admin \
  --reuse-from-tag v2.2.8 \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain>
```

5) 全量升级三端：

```bash
./deploy/ecs/release-from-local.sh \
  --version 2.2.9 \
  --services all \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain>
```

---

## 5. Build 模式（兼容）

如果 `stack.env.local` 中未配置 image 相关字段，会回退到 `build` 模式：

```bash
docker compose up -d --build --remove-orphans
```

---

## 6. GitHub Actions 对接

仓库内工作流：`.github/workflows/deploy-ecs.yml`

运行时仍会调用同一个入口：

```bash
./deploy/ecs/release.sh <tag>
```

你只需保证 ECS 上 `stack.env.local` 配好（尤其是 image 模式字段）。

---

## 7. 常见问题

- **`failed to fetch oauth token` / `auth.docker.io` 连接失败**：
  - 根因：本地到 DockerHub 鉴权链路不稳定或被拦截
  - 建议：先同步基础镜像到你的私有仓库，再在 `stack.env.local` 配置 `DEPLOY_BASE_IMAGE`：

```env
DEPLOY_BASE_IMAGE=crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim
DEPLOY_APT_DEBIAN_MIRROR_URL=http://mirrors.aliyun.com/debian
DEPLOY_APT_SECURITY_MIRROR_URL=http://mirrors.aliyun.com/debian-security
```

  - 同步命令：

```bash
./deploy/ecs/sync-base-image.sh \
  --source-image node:22-slim \
  --target-repo crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node \
  --target-tag 22-slim
```

- **拉不到镜像**：先在 ECS 上 `docker login ghcr.io`
- **还是在构建**：检查 `DEPLOY_MODE=image` 是否生效
- **端口冲突（5577/5555/5566）**：`release.sh` 会自动执行 `pre-release-port-cleanup.sh` 清理旧项目残留容器
- **`no space left on device`（ECS 磁盘打满）**：
  - `release.sh` 会自动执行 `pre-release-disk-cleanup.sh`
  - 可在 `stack.env.local` 调整阈值与策略：

```env
DEPLOY_DOCKER_MIN_FREE_MB=4096
DEPLOY_AUTO_DOCKER_PRUNE=1
DEPLOY_RELEASE_SNAPSHOT_KEEP=5
```
- **证书申请失败**：先检查 DNS 是否全部解析到 ECS
- **2核2G 机器卡死**：避免 build 模式，统一改 image 模式

---

## 8. 进一步阅读

- `docs/40-部署上线/03-GitHub-Actions-连接-ECS-发布说明.md`
- `docs/40-部署上线/04-ECS-首次上线验收清单.md`
- `docs/40-部署上线/05-ECS-Image-模式部署教程-从本地构建到上线.md`
