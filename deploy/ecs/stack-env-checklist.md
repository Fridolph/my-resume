# `stack.env` 服务器填写清单

这份清单配合 `/Users/fri/Desktop/personal/my-resume/deploy/templates/stack.env.example:1` 使用，目标是帮助你在 ECS 上快速填好 `/opt/my-resume/shared/config/stack.env`，并避免因为漏项导致 `release.sh` 失败。

## 文件位置

服务器上的正式配置文件：

```bash
/opt/my-resume/shared/config/stack.env
```

建议先复制模板：

```bash
cp /opt/my-resume/repo/deploy/templates/stack.env.example /opt/my-resume/shared/config/stack.env
```

## 必填项

### Git 与部署根

- `REPO_URL`
  - 用途：服务器上的 repo cache 首次 clone 来源
  - 示例：`https://github.com/<your-name>/my-resume.git`

- `DEPLOY_ROOT`
  - 用途：部署根目录
  - 默认：`/opt/my-resume`
  - 一般可不填，除非你想改目录

### 域名

- `ROOT_DOMAIN`
  - 示例：`fridolph.top`

- `RESUME_DOMAIN`
  - 示例：`resume.fridolph.top`
  - 对应公开站 `web`

- `ADMIN_DOMAIN`
  - 示例：`admin.fridolph.top`
  - 对应后台 `admin`

- `API_DOMAIN`
  - 示例：`api.fridolph.top`
  - 对应 Nest 服务 `server`

### HTTPS

- `LETSENCRYPT_EMAIL`
  - 用途：Certbot 注册邮箱
  - 示例：`ops@fridolph.top`

- `CERTBOT_CERT_NAME`
  - 用途：Let's Encrypt 证书名
  - 默认：不填则使用 `RESUME_DOMAIN`
  - 建议：首次可先不填

### 鉴权

- `JWT_SECRET`
  - 用途：服务端 JWT 签名密钥
  - 建议：长度至少 32 位，使用随机字符串

### AI Provider

- `AI_PROVIDER`
  - 本轮建议固定：`qiniu`

如果 `AI_PROVIDER=qiniu`，以下三项必填：

- `QINIU_AI_API_KEY`
- `QINIU_AI_BASE_URL`
- `QINIU_AI_MODEL`

可选：

- `QINIU_AI_CHAT_MODEL`
- `QINIU_AI_EMBEDDING_MODEL`

## 推荐填写示例

```env
REPO_URL=https://github.com/Fridolph/my-resume.git
ROOT_DOMAIN=fridolph.top
RESUME_DOMAIN=resume.fridolph.top
ADMIN_DOMAIN=admin.fridolph.top
API_DOMAIN=api.fridolph.top
LETSENCRYPT_EMAIL=ops@fridolph.top
JWT_SECRET=replace-with-a-long-random-secret
AI_PROVIDER=qiniu
QINIU_AI_API_KEY=replace-with-real-key
QINIU_AI_BASE_URL=https://api.qnaigc.com/v1
QINIU_AI_MODEL=deepseek-v3
```

## 发布前自查

在服务器上执行：

```bash
cd /opt/my-resume/repo
./deploy/ecs/render-config.sh --tag v2.0.0
```

如果配置无误，会看到成功渲染：

- `releases/v2.0.0/.env`
- `releases/v2.0.0/compose.prod.yml`
- `shared/nginx/my-resume.http.conf`
- `shared/nginx/my-resume.conf`

## 常见漏项

- 域名没有提前解析到 ECS，导致 Certbot 申请失败
- `JWT_SECRET` 太短或仍是占位值
- `QINIU_AI_API_KEY` 未填，`release.sh` 会直接失败
- `REPO_URL` 写成 SSH 地址但服务器未配置 deploy key
- `DEPLOY_ROOT` 改了，但实际目录和脚本运行位置不一致

## 与 GitHub Actions 对应的 Secrets

如果后续启用 `/Users/fri/Desktop/personal/my-resume/.github/workflows/deploy-ecs.yml:1`，建议在仓库 `Settings -> Secrets and variables -> Actions` 中补这些 Secrets：

- `ECS_HOST`
- `ECS_PORT`
- `ECS_USER`
- `ECS_SSH_PRIVATE_KEY`

说明：

- `stack.env` 仍然保存在 ECS 服务器本地，不建议把业务运行时密钥搬进 GitHub Actions
- GitHub Actions 只负责 SSH 到服务器并执行 `release.sh`
