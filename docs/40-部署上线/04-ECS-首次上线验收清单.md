# ECS 首次上线验收清单

这份清单用于首次把 `v2.1.0` 部署到 ECS 时做逐项验收，避免“服务启动了，但链路并没有真正可用”。

配套文档：

- `/Users/fri/Desktop/personal/my-resume/deploy/ecs/README.md:1`
- `/Users/fri/Desktop/personal/my-resume/deploy/ecs/stack-env-checklist.md:1`
- `/Users/fri/Desktop/personal/my-resume/docs/40-部署上线/03-GitHub-Actions-连接-ECS-发布说明.md:1`

## 一、部署前检查

### 域名与网络

- `resume.<your-domain>` 已解析到 ECS 公网 IP
- `admin.<your-domain>` 已解析到 ECS 公网 IP
- `api.<your-domain>` 已解析到 ECS 公网 IP
- ECS 安全组已放行：
  - `22`
  - `80`
  - `443`

### 服务器基础能力

- 已安装 `docker`
- 已安装 `docker compose`
- 已安装 `nginx`
- 已安装 `certbot`
- 已安装 `git`

可执行检查：

```bash
docker --version
docker compose version
nginx -v
certbot --version
git --version
```

### 仓库与部署目录

- 存在 `/opt/my-resume/.git`
- 存在 `/opt/my-resume/.deploy-runtime/shared/config/stack.env.local`
- 存在 `/opt/my-resume/.deploy-runtime/shared/data`
- 存在 `/opt/my-resume/.deploy-runtime/shared/storage/rag`

## 二、配置检查

### `stack.env.local`

确认以下关键项不再是占位值：

- `REPO_URL`
- `ROOT_DOMAIN`
- `RESUME_DOMAIN`
- `ADMIN_DOMAIN`
- `API_DOMAIN`
- `LETSENCRYPT_EMAIL`
- `JWT_SECRET`
- `AI_PROVIDER`

如果 `AI_PROVIDER=qiniu`，再确认：

- `QINIU_AI_API_KEY`
- `QINIU_AI_BASE_URL`
- `QINIU_AI_MODEL`

### 渲染检查

先执行：

```bash
cd /opt/my-resume
./deploy/ecs/render-config.sh --tag v2.1.0
```

确认以下文件已生成：

- `/opt/my-resume/.deploy-runtime/release-snapshots/v2.1.0/.env`
- `/opt/my-resume/.deploy-runtime/release-snapshots/v2.1.0/compose.prod.yml`
- `/opt/my-resume/.deploy-runtime/shared/nginx/my-resume.http.conf`
- `/opt/my-resume/.deploy-runtime/shared/nginx/my-resume.conf`

## 三、首次发布检查

执行：

```bash
cd /opt/my-resume
./deploy/ecs/release.sh v2.1.0
```

发布成功后，确认：

- `/opt/my-resume/.deploy-runtime/current` 已指向 `release-snapshots/v2.1.0`
- `docker compose` 无报错退出
- Nginx reload 成功
- 首次证书申请成功

## 四、容器与进程检查

### Docker 容器

执行：

```bash
cd /opt/my-resume/.deploy-runtime/current
docker compose -f compose.prod.yml --env-file .env ps
```

确认：

- `server` 为 `running`
- `web` 为 `running`
- `admin` 为 `running`

### 本机健康检查

执行：

```bash
curl http://127.0.0.1:5577/
curl http://127.0.0.1:5555/zh
curl http://127.0.0.1:5566/zh
```

预期：

- `server` 返回 `Hello World!`
- `web` 有 HTML 响应
- `admin` 有 HTML 响应

## 五、HTTPS 与反向代理检查

### 证书检查

执行：

```bash
sudo certbot certificates
```

确认：

- 已存在针对你的域名的证书
- 包含：
  - `resume.<your-domain>`
  - `admin.<your-domain>`
  - `api.<your-domain>`

### Nginx 配置检查

执行：

```bash
sudo nginx -t
```

确认返回：

```text
syntax is ok
test is successful
```

## 六、浏览器侧验收

### 公开站

访问：

- `https://resume.<your-domain>`

确认：

- 首页可正常打开
- `zh / en` 切换正常
- 公开简历内容可读
- 卡片、主题、导航样式正常

### 后台

访问：

- `https://admin.<your-domain>`

确认：

- 登录页可打开
- `admin` 账号可登录
- 进入后台后 sidebar、主题、HeroUI 样式正常

### API

访问：

- `https://api.<your-domain>/`
- `https://api.<your-domain>/api/resume/published`

确认：

- 能返回响应
- 至少接口链路可达

## 七、业务主链路验收

### admin 编辑与发布

确认：

- 能进入简历编辑页
- 能保存草稿
- 能执行发布

### web 公开读取

确认：

- 发布后的简历内容能在公开站读取到
- 中英文切换与发布内容一致

### 导出链路

分别测试：

- Markdown 中文
- Markdown 英文
- PDF 中文
- PDF 英文

确认：

- 可正常下载
- 内容与最新已发布版一致
- 中文 PDF 可读

## 八、AI 相关验收

如果你本轮也要连带验证 AI：

- `AI_PROVIDER=qiniu` 生效
- admin AI 页面可正常打开
- 基础分析请求不直接报 provider 配置错误

如果本轮只验证部署基础设施，这部分可先记为“后续补验收”。

## 九、回滚预演

即使首次上线成功，也建议做一次最小回滚演练：

```bash
cd /opt/my-resume
./deploy/ecs/rollback.sh v2.1.0
```

目标不是回到旧版本，而是确认：

- 回滚脚本本身可执行
- `current` 软链与 Compose 入口工作正常

## 十、GitHub Actions 验收

如果你已经配好 Actions Secrets，再做这一步：

进入：

`GitHub -> Actions -> Deploy ECS -> Run workflow`

确认：

- 工作流能正常启动
- 能 SSH 到 ECS
- 能在远端执行 `release.sh`
- 同一 tag 重复发布不会报错

## 十一、常见失败点

- 域名解析还没生效，导致证书申请失败
- 安全组没放行 `80/443`
- `stack.env.local` 仍然保留占位值
- `JWT_SECRET` 太弱或为空
- `QINIU_AI_API_KEY` 漏填
- ECS 上磁盘空间不足，导致镜像构建失败
- Docker 安装成功但 `docker compose` 插件不可用

## 十二、验收完成标准

满足以下条件后，可以视为 `v2.1.0` 已具备 ECS 上线基线：

- 三个域名都可通过 HTTPS 打开
- `web/admin/server` 容器均稳定运行
- admin 登录、编辑、发布主链路正常
- web 公开读取正常
- Markdown / PDF 导出正常
- GitHub Actions 至少成功触发过一次远端发布
