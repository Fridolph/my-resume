# ECS Image 模式部署教程（从本地构建到上线）

> 目标：把编译负载从 ECS 移走，改成“本地/CI 构建镜像，ECS 只拉取并启动”。
>
> 适用：`2核2G` 这类轻量 ECS（强烈推荐）。

---

## 0. 你将得到什么

完成后，发布路径会变成：

1. 本地构建三端镜像（`server/web/admin`）
2. 推送到镜像仓库（如 GHCR）
3. ECS 执行 `release.sh <tag>`
4. ECS 自动 `pull + up --no-build`，不再 `--build`

---

## 1. 本地安装 Docker（你当前还没装）

### macOS（推荐）

1. 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 启动后确认：

```bash
docker version
docker buildx version
docker compose version
```

### Ubuntu / Debian（本地 Linux）

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
newgrp docker

docker version
docker buildx version
docker compose version
```

### Windows

安装 Docker Desktop（WSL2 模式），然后在 PowerShell / WSL 中执行同样的版本检查。

---

## 2. 准备镜像仓库（以 GHCR 为例）

### 2.1 创建 GitHub Token

创建一个可用于 GHCR 的 token（classic 或 fine-grained 均可），至少包含：

- `write:packages`
- `read:packages`

### 2.2 本地登录 GHCR

```bash
echo '<YOUR_GITHUB_TOKEN>' | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin
```

---

## 3. 本地构建并推送镜像

仓库已内置脚本：

- `deploy/ecs/sync-base-image.sh`（先同步基础镜像到私有仓库）
- `deploy/ecs/build-and-push-images.sh`（构建并推送三端业务镜像）

### 3.0 先把基础镜像同步到你的私有仓库（强烈推荐）

```bash
./deploy/ecs/sync-base-image.sh \
  --source-image node:22-slim \
  --target-repo crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node \
  --target-tag 22-slim \
  --stamp-tag 22-slim-20260421
```

完成后，把基础镜像固定为你的私有仓库地址：

```bash
BASE_IMAGE=crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim
```

支持三种 tag 输入方式：

- `--tag v2.2.13`
- `--version 2.2.13`（自动转 `v2.2.13`）
- `--auto-tag`（自动识别当前 `HEAD` 的 `v*` tag）

```bash
cd /path/to/my-resume

./deploy/ecs/build-and-push-images.sh \
  --version 2.2.13 \
  --image-prefix ghcr.io/<your-user-or-org>/my-resume \
  --platform linux/amd64 \
  --engine-build \
  --base-image $BASE_IMAGE \
  --apt-debian-mirror-url http://mirrors.aliyun.com/debian \
  --apt-security-mirror-url http://mirrors.aliyun.com/debian-security
```

推送成功后，你会得到：

- `ghcr.io/<...>/my-resume/server:v2.2.13`
- `ghcr.io/<...>/my-resume/web:v2.2.13`
- `ghcr.io/<...>/my-resume/admin:v2.2.13`

若只升级部分服务（例如仅构建 `web + admin`，复用旧 `server`）：

```bash
./deploy/ecs/build-and-push-images.sh \
  --version 2.2.13 \
  --server-image <registry>/my-resume-server \
  --web-image <registry>/my-resume-web \
  --admin-image <registry>/my-resume-admin \
  --services web,admin \
  --reuse-from-tag v2.2.12 \
  --platform linux/amd64
```

---

## 4. ECS 侧配置为 image 模式

编辑：

```bash
/opt/my-resume/.deploy-runtime/shared/config/stack.env.local
```

关键字段：

```env
DEPLOY_MODE=image
IMAGE_REPOSITORY_PREFIX=ghcr.io/<your-user-or-org>/my-resume
DEPLOY_BASE_IMAGE=crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim
# IMAGE_TAG 可不填，默认使用 release.sh 传入 tag
```

如果你希望服务器自动 `docker login`，可再填：

```env
REGISTRY_HOST=ghcr.io
REGISTRY_USERNAME=<username>
REGISTRY_PASSWORD=<token>
```

> 不填也可以，但要在 ECS 手动登录一次：
>
> `docker login ghcr.io`

---

## 5. ECS 发布（只拉镜像）

```bash
cd /opt/my-resume
git fetch --tags --force
./deploy/ecs/release.sh v2.2.13
```

在 `image` 模式下，脚本会自动执行：

1. `docker compose pull`
2. `docker compose up -d --no-build --remove-orphans`

不会再在 ECS 上做 `next build` / `pnpm install`。

如果你希望本地一键“构建推送 + ECS 发布”，推荐直接执行（三端全量重建）：

```bash
# 可选：先确认私有基础镜像可拉取
docker pull crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim

./deploy/ecs/release-from-local.sh \
  --version 2.2.13 \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain> \
  --ecs-user root \
  --ecs-port 22 \
  --engine-build \
  --base-image crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim \
  --apt-debian-mirror-url http://mirrors.aliyun.com/debian \
  --apt-security-mirror-url http://mirrors.aliyun.com/debian-security
```

完整流程（推荐顺序）：

```bash
# 1) 保持代码和 tag 最新
git checkout main
git pull origin main
git fetch --tags --force

# 2) 预拉私有基础镜像
docker pull crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim

# 3) 本地构建 + 推送 + 远程发布
./deploy/ecs/release-from-local.sh \
  --version 2.2.13 \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain> \
  --ecs-user root \
  --ecs-port 22 \
  --engine-build \
  --base-image crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim \
  --apt-debian-mirror-url http://mirrors.aliyun.com/debian \
  --apt-security-mirror-url http://mirrors.aliyun.com/debian-security

# 4) 发布后快速验收
curl -I https://api-resume.<your-domain>/api
curl -I https://resume.<your-domain>
curl -I https://admin-resume.<your-domain>/login
```

如果只修复后端（例如权限能力返回异常），可仅重建 `server`：

```bash
./deploy/ecs/release-from-local.sh \
  --version 2.2.13 \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain> \
  --ecs-user root \
  --ecs-port 22 \
  --services server \
  --skip-reuse-unselected \
  --engine-build \
  --base-image crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim \
  --apt-debian-mirror-url http://mirrors.aliyun.com/debian \
  --apt-security-mirror-url http://mirrors.aliyun.com/debian-security
```

> 注意：如果这次改动涉及 `server`，不要只发 `web/admin`，否则会出现前端已更新但接口能力仍是旧版本的问题。

> 自动创建 tag 前会校验：当前必须在 `main`、工作区干净、且 `main` 与 `origin/main` 完全同步。

若当前提交已打 tag，也可自动识别：

```bash
./deploy/ecs/release-from-local.sh \
  --auto-tag \
  --services all \
  --stack-env ./.env.stack.local \
  --ecs-host <ecs-ip-or-domain>
```

---

## 6. 验收清单

发布后检查：

- `https://resume.fridolph.top`
- `https://admin-resume.fridolph.top`
- `https://api-resume.fridolph.top`

服务器检查：

```bash
docker compose -f /opt/my-resume/.deploy-runtime/current/compose.prod.yml \
  --env-file /opt/my-resume/.deploy-runtime/current/.env ps
```

---

## 7. 常见问题

### Q1：ECS 还是在构建

- 检查 `DEPLOY_MODE=image` 是否真的在生效配置文件里。
- 执行 `./deploy/ecs/render-config.sh --tag v2.1.0` 后查看生成的 `compose.prod.yml`：
  - 若包含 `image:` 即正确
  - 若包含 `build:` 说明仍在 build 模式

### Q2：镜像拉取 401/403

- GHCR token 权限不足，补 `read:packages`
- 仓库权限/包权限不可见
- ECS 未登录或登录用户不对

### Q3：`manifest unknown`

- 镜像 tag 没推成功，重新执行本地推送
- `release.sh` 使用的 tag 与镜像 tag 不一致

### Q4：`auth.docker.io` 超时 / token 拉取失败

如果你本地网络对 Docker Hub 不稳定，建议先同步基础镜像到私有仓库，再在发布时使用私有地址：

```bash
./deploy/ecs/sync-base-image.sh \
  --source-image node:22-slim \
  --target-repo crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node \
  --target-tag 22-slim
```

更推荐做成长期配置（避免每次手动传参）：

```env
# .env.stack.local
DEPLOY_BASE_IMAGE=crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim
DEPLOY_APT_DEBIAN_MIRROR_URL=http://mirrors.aliyun.com/debian
DEPLOY_APT_SECURITY_MIRROR_URL=http://mirrors.aliyun.com/debian-security
```

`release-from-local.sh` 与 `build-and-push-images.sh` 会自动读取以上变量。  
不设置 `DEPLOY_APT_*` 时会默认使用 Debian 官方源，避免写死到某个云厂商。

### Q5：`buildx` 仍反复拉取 Docker Hub 导致超时

部分网络环境下，`docker buildx` 的 builder 容器会再次访问 Docker Hub 获取元数据，即使已本地 `docker pull` 也可能超时。
这时建议切换到脚本的 `engine` 模式（`docker build + docker push`）：

```bash
./deploy/ecs/build-and-push-images.sh \
  --tag v2.2.0 \
  --image-prefix ghcr.io/<your-user-or-org>/my-resume \
  --platform linux/amd64 \
  --engine-build \
  --base-image crpi-xxxx.cn-<region>.personal.cr.aliyuncs.com/<namespace>/my-resume-base-node:22-slim
```

> 本项目在 `v2.2.0` 发布阶段已用该模式完成本地构建与推送验证。

---

## 8. 与 CI/CD 的关系

`Deploy ECS` 工作流仍调用 `release.sh`，所以你只需保证：

- ECS 上 `stack.env.local` 配置正确（`DEPLOY_MODE=image`）
- 镜像仓库可拉取

这样 CI/CD 与手工发布会共用同一条发布链路。
