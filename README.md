# my-resume

一个以“个人简历重构”为主题的教程型全栈 monorepo。

当前仓库已经从旧版静态 `Vue3 + Vite` 简历站，渐进重构到新的三端结构：

- `apps/web`：公开简历展示端
- `apps/admin`：后台管理端
- `apps/server`：唯一业务后端

项目目标不是一次性做成复杂 SaaS，而是用小步里程碑把一个真实项目从静态页面，逐步推进到：

- 可登录
- 可编辑
- 可发布
- 可导出
- 可接 AI
- 可部署
- 可写成教程

## 当前状态

目前已经完成 `M1 ~ M10`，达到“基础教程版闭环”状态。

已具备的主线能力：

- Monorepo 基础工程与共享配置
- `admin / viewer` 最小鉴权与角色边界
- 双语标准简历内容模型与草稿 / 发布流
- `Markdown / PDF` 导出与下载
- SQLite / libsql + Drizzle 持久化
- `web / admin` 主题基线与最小共享 UI
- AI 工作台、文件提取、管理员真实分析、viewer 缓存只读体验
- GitHub Actions、Vercel / 云服务器部署文档

当前建议状态：

- 功能开发可以阶段性暂停
- 先进入“阶段总结 + 教程整理”模式
- 后续按新的里程碑继续小步演进

## 仓库结构

```text
apps/
  admin/   Next.js 后台管理端
  web/     Next.js 公开展示端
  server/  NestJS 业务后端

packages/
  api-client/  最小共享契约
  config/      共享配置
  ui/          最小共享 UI 与主题

docs/
  00-文档导航.md
  10-架构设计/
  20-研发流程/
  30-开发日志/
  40-教程与博客/
```

## 阅读入口

- 文档首页：[`docs/README.md`](./docs/README.md)
- 文档导航：[`docs/00-文档导航.md`](./docs/00-%E6%96%87%E6%A1%A3%E5%AF%BC%E8%88%AA.md)
- 总方案：[`docs/10-架构设计/01-个人简历-monorepo-重构总方案-v1学习版.md`](./docs/10-%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/01-%E4%B8%AA%E4%BA%BA%E7%AE%80%E5%8E%86-monorepo-%E9%87%8D%E6%9E%84%E6%80%BB%E6%96%B9%E6%A1%88-v1%E5%AD%A6%E4%B9%A0%E7%89%88.md)
- GitHub 开发流程：[`docs/20-研发流程/01-GitHub-标准开发流程.md`](./docs/20-%E7%A0%94%E5%8F%91%E6%B5%81%E7%A8%8B/01-GitHub-%E6%A0%87%E5%87%86%E5%BC%80%E5%8F%91%E6%B5%81%E7%A8%8B.md)
- 系列文章目录：[`docs/40-教程与博客/README.md`](./docs/40-%E6%95%99%E7%A8%8B%E4%B8%8E%E5%8D%9A%E5%AE%A2/README.md)

## M1 ~ M10 路线总览

### M1 基础工程

- 建立 `pnpm workspace + turbo`
- 建立 `apps / packages / docs` 基础骨架
- 确立后续渐进重构节奏

### M2 鉴权与角色

- `NestJS` 最小后端脚手架
- `admin / viewer` 角色模型
- JWT 登录闭环与后台最小登录壳

### M3 简历内容与发布流

- 双语标准简历数据模型
- 草稿 / 发布态分离
- `web` 公开读取已发布版本

### M4 AI 工具链

- Provider 适配器接口
- 文件提取入口
- 缓存分析报告
- `admin` 触发 / `viewer` 只读边界

### M5 导出与下载

- 服务端统一导出 `Markdown / PDF`
- `web / admin` 下载入口

### M6 测试、CI/CD、部署

- 单元测试基建
- GitHub Actions
- Vercel + 云服务器部署文档

### M7 展示层与内容接入

- 真实草稿读取与保存
- 旧版简历内容迁移
- `web` 公开简历页面模块化渲染

### M8 数据持久化与共享契约

- Drizzle / libsql 最小接入
- 发布流持久化改造
- `packages/api-client` 最小共享契约
- Jest 迁移到 Vitest

### M9 体验基线与共享 UI

- 共享主题 tokens 与 `light / dark`
- 后台信息架构整理
- 公开页视觉基线升级
- 最小共享展示组件沉淀

### M10 AI 工作台闭环

- AI 工作台入口
- 上传提取与预览
- 管理员真实分析闭环
- viewer 缓存只读体验

## 阶段成果说明

### 现在已经闭环的内容

- 基础工程可复用
- 三端可分别启动与访问
- 后台管理具备最小内容运营能力
- 公开站具备最小成品展示能力
- AI 演示具备输入、分析、结果、只读体验的完整教学链路

### 现在还刻意没做的内容

- Docker 一键部署
- AI 队列与任务中心
- 分析历史持久化
- 多模板简历系统
- 商业版 JD 多版本能力
- 更完整的后台 UI 精修

这些内容不是遗漏，而是明确留给后续里程碑。

## 推荐启动方式

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备环境变量

复制 `.env.example`，并按本地环境补充：

- `JWT_SECRET`
- `DATABASE_URL`
- `AI_PROVIDER`
- 对应 Provider 的 API Key

当前仓库内已有：

- [`.env.example`](./.env.example)

### 3. 分别启动三端

```bash
pnpm --filter @my-resume/server start:dev
pnpm --filter @my-resume/web dev
pnpm --filter @my-resume/admin dev
```

默认端口：

- `web`：`5555`
- `admin`：`5566`
- `server`：`5577`

### 4. 常用校验命令

```bash
pnpm test
pnpm test:e2e
pnpm typecheck:all
pnpm build:all
```

## 一个当前需要特别说明的点

根目录 `package.json` 里仍保留着旧版 Vue 简历站的 `dev / build / preview` 脚本。

这代表：

- 仓库仍保留旧站历史上下文
- 当前主开发线已经切换到 monorepo 三端

所以如果你是第一次阅读这个项目，建议优先按上面的三端方式启动，而不是直接把根目录脚本当成新架构入口。

## 教程与日志入口

- 开发日志目录：[`docs/30-开发日志/`](./docs/30-%E5%BC%80%E5%8F%91%E6%97%A5%E5%BF%97/)
- 里程碑教程目录：[`docs/40-教程与博客/`](./docs/40-%E6%95%99%E7%A8%8B%E4%B8%8E%E5%8D%9A%E5%AE%A2/)

如果你想按顺序阅读，推荐从这里开始：

1. 总方案
2. GitHub 标准开发流程
3. M2 ~ M10 教程大纲
4. 对应 issue 的开发日志

## 下一阶段建议

如果继续做下一轮里程碑，最推荐优先补这三个方向：

1. `Docker / docker-compose / 一键本地启动`
2. AI 队列、任务状态与分析历史
3. 前台多模板与更完整展示系统

但如果当前目标是“先形成一套高质量基础教程”，那么现在已经适合暂停功能开发，转入：

- README / 文档整理
- 教程正文撰写
- 系列文章编排

## License

`MIT`
