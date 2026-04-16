# ECS 部署脚本（`v2.1.0` 基线）

这套脚本面向 **单台 ECS + Docker Compose + Nginx + HTTPS + 三个子域名** 的部署形态，当前以 `main` 上的 `v2.1.0` tag 为稳定基线，并为后续 GitHub Actions 通过 SSH 复用同一套发布脚本预留了接口。

## 目录说明

- `deploy/ecs/bootstrap.sh`：安装/检测 Docker、Nginx、Certbot，并初始化 `/opt/my-resume`
- `deploy/ecs/render-config.sh`：渲染生产 `.env`、`compose.prod.yml` 和 Nginx 配置
- `deploy/ecs/release.sh <tag>`：拉取指定 tag、构建并启动三端、申请证书、做健康检查
- `deploy/ecs/rollback.sh <tag>`：回滚到指定 tag 或上一版 release
- `deploy/ecs/stack-env-checklist.md`：服务器侧 `stack.env.local` 填写清单
- `deploy/templates/*`：部署模板

延伸阅读：

- `/Users/fri/Desktop/personal/my-resume/docs/40-部署上线/03-GitHub-Actions-连接-ECS-发布说明.md:1`
- `/Users/fri/Desktop/personal/my-resume/docs/40-部署上线/04-ECS-首次上线验收清单.md:1`

## 部署目录约定

脚本默认把部署根目录固定为：

```bash
/opt/my-resume
```

关键结构如下：

```text
/opt/my-resume/
  .deploy-runtime/
    repo-cache/                  Git 仓库缓存，release.sh 会在这里 fetch tags
    release-snapshots/<tag>/     每个 tag 的不可变发布快照
    current -> release-snapshots/*
    shared/
      config/stack.env.local     脱敏后的生产配置
      data/                SQLite 持久化目录
      storage/rag/         RAG 索引持久化目录
      nginx/               渲染后的 Nginx 配置
      state/               当前/上一版 release 元数据
/var/www/my-resume-certbot  Certbot ACME challenge webroot
```

## 域名与端口

- `resume.<your-domain>` → `web`
- `admin-resume.<your-domain>` → `admin`
- `api-resume.<your-domain>` → `server`

容器端口固定为：

- `web=5555`
- `admin=5566`
- `server=5577`

对外访问全部经过 Nginx；Compose 只把端口绑定到 `127.0.0.1`。

补充说明：

- `web` / `admin` 虽然是前端应用，但当前并不是静态导出站点，而是 Next.js 生产服务。
- 线上形态为：
  - `web`：`next build` 后使用 `standalone` 产物常驻在 `5555`
  - `admin`：`next build` 后使用 `standalone` 产物常驻在 `5566`
  - `server`：Nest 生产构建常驻在 `5577`
- 因此当前方案不需要 PM2，也不需要把 `web/admin` 复制到静态 `dist` 目录交给 Nginx 直出。

## 首次部署步骤

### 1. 确认 DNS

先把这 3 个子域名都解析到 ECS 公网 IP：

- `resume.<your-domain>`
- `admin-resume.<your-domain>`
- `api-resume.<your-domain>`

### 2. 克隆仓库

建议直接把仓库 clone 到部署根目录本身：

```bash
sudo mkdir -p /opt/my-resume
sudo chown -R "$USER":"$USER" /opt/my-resume
git clone <your-repo-url> /opt/my-resume
cd /opt/my-resume
```

### 3. 执行 bootstrap

```bash
./deploy/ecs/bootstrap.sh
```

脚本会：

- 安装 `docker` / `docker compose` / `nginx` / `certbot`
- 初始化 `/opt/my-resume/.deploy-runtime/shared/*`
- 生成 `/opt/my-resume/.deploy-runtime/shared/config/stack.env.local`

### 4. 填写生产配置

编辑：

```bash
/opt/my-resume/.deploy-runtime/shared/config/stack.env.local
```

至少要填这些项：

- `REPO_URL`
- `DEPLOY_ROOT=/root/my-resume`（如果你要把整套部署都放在 `/root/my-resume`）
- `ROOT_DOMAIN`
- `RESUME_DOMAIN`
- `ADMIN_DOMAIN`
- `API_DOMAIN`
- `LETSENCRYPT_EMAIL`
- `CERTBOT_KEY_TYPE=ecdsa`（可选；已有 ECDSA 证书时建议保留）
- `CERTBOT_WEBROOT=/var/www/my-resume-certbot`（可选；不要放在 `/root` 下）
- `JWT_SECRET`
- `AI_PROVIDER=qiniu`
- `QINIU_AI_API_KEY`
- `QINIU_AI_BASE_URL`
- `QINIU_AI_MODEL`

兼容说明：

- 新版默认读取 `/opt/my-resume/.deploy-runtime/shared/config/stack.env.local`
- 如果你的 ECS 已经使用旧目录 `/opt/my-resume/shared/config/stack.env.local`，脚本也会自动识别，不需要马上迁移

### 5. 可选：先本地渲染检查

这一步不会真正启动服务，适合先验证模板输出：

```bash
./deploy/ecs/render-config.sh --tag v2.1.0 --release-dir /tmp/my-resume-v2.1.0
```

### 6. 发布 `v2.1.0`

如果服务器上已经有旧的静态站点配置文件占用了 `resume.<your-domain>`，先备份移走，避免 `server_name` 冲突。例如：

```bash
sudo mv /etc/nginx/conf.d/resume-fridolph-top.conf /etc/nginx/conf.d/resume-fridolph-top.conf.bak
```

```bash
./deploy/ecs/release.sh v2.1.0
```

脚本会按顺序执行：

1. 拉取/刷新仓库 tag
2. 生成 `/opt/my-resume/.deploy-runtime/release-snapshots/v2.1.0`
3. 渲染生产 `.env`、Compose、Nginx 配置
4. 先装载 HTTP Nginx 配置
5. 对三个域名执行 HTTP ACME challenge 自检
6. 通过 `certbot certonly --webroot` 申请 / 扩展证书
7. 切换到 HTTPS Nginx 配置
8. `docker compose up -d --build --remove-orphans`
9. 对 `web/admin/server` 做本机健康检查

## 回滚

回滚到指定 tag：

```bash
./deploy/ecs/rollback.sh v2.1.0
```

回滚到上一版：

```bash
./deploy/ecs/rollback.sh
```

## 给后续 CI/CD 的复用方式

后续 GitHub Actions 只需要 SSH 到 ECS 后执行同一个入口：

```bash
cd /opt/my-resume
git fetch --tags --force
./deploy/ecs/release.sh v2.1.0
```

这样可以确保：

- 手工验证和自动部署共用同一套发布逻辑
- 回滚继续沿用 release 目录与软链策略
- CI 只负责传入 tag，不负责拼接部署细节

仓库内已经补了一个最小工作流：

- `/Users/fri/Desktop/personal/my-resume/.github/workflows/deploy-ecs.yml:1`

它当前保持 **手动触发**，只做 3 件事：

1. 校验待部署 tag 存在
2. 通过 SSH 登录 ECS
3. 在服务器上执行 `./deploy/ecs/release.sh <tag>`

需要的 GitHub Secrets：

- `ECS_HOST`
- `ECS_PORT`
- `ECS_USER`
- `ECS_SSH_PRIVATE_KEY`

运行时业务密钥仍保留在 ECS 本地 `stack.env.local`，不放进 GitHub Actions。

## 当前边界

- 当前脚本不改业务代码，也不顺手收紧 `CORS_ORIGINS`
- 默认支持 Debian / Ubuntu 的 `apt`，以及 Alibaba Cloud / RHEL 系常见的 `dnf` / `yum`
- Nginx 站点配置会自动兼容 `/etc/nginx/conf.d` 与 `/etc/nginx/sites-available`
- TLS 首版基于 `certbot certonly --webroot`，避免 Certbot 临时改写 Nginx 配置导致 challenge 被旧 HTTPS 站点拦截
- SQLite 与 RAG 索引通过宿主机目录持久化，不额外引入外部数据库
