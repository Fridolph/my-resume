# `stack.env.local` 服务器填写清单（Image 模式优先）

本清单配合 `deploy/templates/stack.env.example` 使用，目标是在 ECS 上正确填写：

```bash
/opt/my-resume/.deploy-runtime/shared/config/stack.env.local
```

> 兼容旧路径：`/opt/my-resume/shared/config/stack.env.local`

---

## 1) 文件准备

```bash
cp /opt/my-resume/deploy/templates/stack.env.example \
  /opt/my-resume/.deploy-runtime/shared/config/stack.env.local
```

---

## 2) 必填项（所有模式）

### Git 与部署目录

- `REPO_URL`
  - 服务器上 repo-cache 的 clone 来源
  - 示例：`https://github.com/Fridolph/my-resume.git`

- `DEPLOY_ROOT`
  - 默认 `/opt/my-resume`
  - 如果你实际在 `/root/my-resume`，必须显式写：
    `DEPLOY_ROOT=/root/my-resume`

### 域名

- `ROOT_DOMAIN`（例：`fridolph.top`）
- `RESUME_DOMAIN`（例：`resume.fridolph.top`）
- `ADMIN_DOMAIN`（例：`admin-resume.fridolph.top`）
- `API_DOMAIN`（例：`api-resume.fridolph.top`）

### HTTPS

- `LETSENCRYPT_EMAIL`
- `CERTBOT_KEY_TYPE`（建议 `ecdsa`）
- `CERTBOT_WEBROOT`（建议 `/var/www/my-resume-certbot`，不要放 `/root`）

### 鉴权与 AI

- `JWT_SECRET`（建议 32 位以上随机字符串）
- `AI_PROVIDER`

若 `AI_PROVIDER=qiniu`，还需：

- `QINIU_AI_API_KEY`
- `QINIU_AI_BASE_URL`
- `QINIU_AI_MODEL`

---

## 3) 镜像部署必填项（推荐）

### 切换为 image 模式

```env
DEPLOY_MODE=image
```

### 镜像仓库配置（推荐用前缀）

```env
IMAGE_REPOSITORY_PREFIX=ghcr.io/<your-user-or-org>/my-resume
```

脚本会自动推导：

- `.../server`
- `.../web`
- `.../admin`

### 镜像 Tag

- 通常不填 `IMAGE_TAG`，默认使用 `release.sh <tag>` 传入值（如 `v2.1.0`）
- 若你要固定镜像 tag，可显式设置：

```env
IMAGE_TAG=v2.1.0
```

### 可选：自动 docker login

如果你希望 `release.sh` 自动登录镜像仓库，可再填：

```env
REGISTRY_HOST=ghcr.io
REGISTRY_USERNAME=<username>
REGISTRY_PASSWORD=<token>
```

> 不填也可以，但需要你在 ECS 上先手动 `docker login` 一次。

---

## 4) 推荐最小示例（image 模式）

```env
REPO_URL=https://github.com/Fridolph/my-resume.git
DEPLOY_ROOT=/root/my-resume

DEPLOY_MODE=image
IMAGE_REPOSITORY_PREFIX=ghcr.io/fridolph/my-resume

ROOT_DOMAIN=fridolph.top
RESUME_DOMAIN=resume.fridolph.top
ADMIN_DOMAIN=admin-resume.fridolph.top
API_DOMAIN=api-resume.fridolph.top

LETSENCRYPT_EMAIL=249121486@qq.com
CERTBOT_KEY_TYPE=ecdsa
CERTBOT_WEBROOT=/var/www/my-resume-certbot

JWT_SECRET=replace-with-a-long-random-secret

AI_PROVIDER=qiniu
QINIU_AI_API_KEY=replace-with-real-key
QINIU_AI_BASE_URL=https://api.qnaigc.com/v1
QINIU_AI_MODEL=deepseek-v3
```

---

## 5) 发布前自查

先渲染配置（不启动服务）：

```bash
cd /opt/my-resume
./deploy/ecs/render-config.sh --tag v2.1.0
```

确认输出：

- `.deploy-runtime/release-snapshots/v2.1.0/.env`
- `.deploy-runtime/release-snapshots/v2.1.0/compose.prod.yml`
- `.deploy-runtime/shared/nginx/my-resume.http.conf`
- `.deploy-runtime/shared/nginx/my-resume.conf`

再发布：

```bash
./deploy/ecs/release.sh v2.1.0
```

---

## 6) 常见问题

- **镜像拉取失败**：先在 ECS 执行 `docker login ghcr.io`，并确认 tag 已推送。
- **证书申请失败**：先检查 3 个域名 DNS 是否已解析到 ECS。
- **仍在服务器构建**：确认 `DEPLOY_MODE=image` 已生效。
- **路径不一致**：`DEPLOY_ROOT` 必须与你实际仓库目录一致。
