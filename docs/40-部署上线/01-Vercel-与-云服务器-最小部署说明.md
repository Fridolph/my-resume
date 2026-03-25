# Vercel 与云服务器最小部署说明

本文档对应 `M6 / issue-22`，目标是让读者基于当前仓库结构，把三个应用以最小可用方式部署上线：

- `apps/web`：公开简历展示端
- `apps/admin`：后台管理端
- `apps/server`：唯一业务后端

当前方案遵循本仓库既定原则：

- `web / admin` 部署到 `Vercel`
- `server` 部署到云服务器
- 所有业务 API 统一走 `NestJS`
- 不把业务逻辑拆到 `Next Route Handlers`

## 一、推荐部署拓扑

- `web`
  - 域名示例：`resume.example.com`
  - 平台：`Vercel`
- `admin`
  - 域名示例：`admin.resume.example.com`
  - 平台：`Vercel`
- `server`
  - 域名示例：`api.resume.example.com`
  - 平台：云服务器 + `Nginx`

## 二、部署前准备

### 1. 本地先通过质量门禁

在推送部署前，建议至少先通过：

```bash
pnpm test:ci
pnpm typecheck:all
pnpm build:all
```

### 2. 准备生产环境变量

当前 `apps/server` 会按以下顺序读取环境文件：

- `.env.production.local`
- `.env.local`
- `.env.production`
- `.env`

建议在仓库根目录准备一份生产用环境变量模板，再将其同步到服务器进程环境中。

最小示例：

```env
NODE_ENV=production

# server
PORT=5577
JWT_SECRET=replace-with-your-own-secret

# AI provider
AI_PROVIDER=qiniu
QINIU_AI_API_KEY=replace-with-your-own-key
QINIU_AI_BASE_URL=https://api.qnaigc.com/v1
QINIU_AI_MODEL=deepseek-v3
```

如果你改用其他 provider，可参考根目录 `.env.example` 中的：

- `DEEPSEEK_*`
- `OPENAI_COMPATIBLE_*`

### 3. 准备前端环境变量

#### `apps/web`

最小需要：

```env
RESUME_API_BASE_URL=https://api.resume.example.com
NEXT_PUBLIC_API_BASE_URL=https://api.resume.example.com
```

#### `apps/admin`

最小需要：

```env
NEXT_PUBLIC_API_BASE_URL=https://api.resume.example.com
```

## 三、部署 `apps/web` 到 Vercel

### 1. 创建 Vercel 项目

- 导入 GitHub 仓库
- Framework Preset 选择 `Next.js`
- Root Directory 选择 `apps/web`

### 2. 推荐构建设置

- Install Command

```bash
pnpm install --frozen-lockfile
```

- Build Command

```bash
pnpm build
```

- Output Directory
  - 使用 `Next.js` 默认值即可

### 3. 配置环境变量

在 Vercel 项目中配置：

- `RESUME_API_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`

都指向你的后端地址，例如：

```env
https://api.resume.example.com
```

### 4. 部署后验证

- 首页可正常打开
- 能读取已发布简历内容
- `zh / en` 切换正常
- `light / dark` 切换正常
- 导出下载链接指向 `apps/server`

## 四、部署 `apps/admin` 到 Vercel

### 1. 创建第二个 Vercel 项目

- 导入同一 GitHub 仓库
- Framework Preset 选择 `Next.js`
- Root Directory 选择 `apps/admin`

### 2. 推荐构建设置

- Install Command

```bash
pnpm install --frozen-lockfile
```

- Build Command

```bash
pnpm build
```

### 3. 配置环境变量

至少配置：

```env
NEXT_PUBLIC_API_BASE_URL=https://api.resume.example.com
```

### 4. 部署后验证

- 登录页可正常打开
- 能请求 `apps/server` 登录接口
- 角色为 `viewer` 时只能体验缓存结果
- 角色为 `admin` 时可进入真实操作入口

## 五、部署 `apps/server` 到云服务器

以下步骤适用于常见 Linux 云服务器，刻意不绑定具体厂商。

### 1. 安装基础环境

建议安装：

- `Node.js 20`
- `pnpm 10`
- `Nginx`
- `PM2`

示例：

```bash
npm install -g pnpm pm2
```

### 2. 拉取代码并安装依赖

```bash
git clone <your-repo-url>
cd my-resume
pnpm install --frozen-lockfile
```

### 3. 配置服务端环境变量

在仓库根目录创建：

```bash
cp .env.example .env.production.local
```

然后至少修改：

- `NODE_ENV=production`
- `PORT=5577`
- `JWT_SECRET`
- AI provider 对应密钥

### 4. 构建后端

```bash
pnpm --filter @my-resume/server build
```

### 5. 启动后端

可先直接验证：

```bash
pnpm --filter @my-resume/server start:prod
```

推荐使用 `PM2` 常驻：

```bash
pm2 start "pnpm --filter @my-resume/server start:prod" --name my-resume-server
pm2 save
```

### 6. 配置 Nginx 反向代理

示例：

```nginx
server {
  listen 80;
  server_name api.resume.example.com;

  location / {
    proxy_pass http://127.0.0.1:5577;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

修改完成后：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 六、跨域与域名注意事项

当前仓库中的 `apps/server/src/main.ts` 仍然使用：

```ts
app.enableCors({
  origin: true,
});
```

也就是说，现阶段后端还没有把 `.env.example` 中的 `CORS_ORIGINS` 真正收敛到运行时配置里。  
因此当前最小部署文档按“仓库现状”描述：**跨域默认放开**。

如果你准备把项目对公网长期开放，建议下一步把 `CORS_ORIGINS` 接入到 `NestJS` 的 `enableCors` 配置中，再把 `web / admin` 的正式域名收敛进去。

## 七、最小上线验收清单

上线后至少检查：

- `web` 首页可访问
- `admin` 登录页可访问
- `server` 根路由可访问
- `web` 能读取已发布简历
- `admin` 能完成登录
- `viewer` 无法触发真实 AI
- `admin` 可访问真实 AI 入口
- `markdown / pdf` 下载正常

## 八、当前阶段的已知边界

本说明基于仓库当前状态，默认：

- 暂未强制接入数据库
- 暂未强制接入 Redis / BullMQ
- 暂未引入自动化 IaC
- 当前后端跨域仍是 `origin: true`
- 暂未覆盖 HTTPS、CDN、日志平台、监控平台等更完整运维体系

这些内容可以在后续商业版 / 进阶教程里继续展开。
