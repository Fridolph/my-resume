# M20-issue-210：Docker 镜像构建缓存与运行镜像裁剪

- Issue：[#210](https://github.com/Fridolph/my-resume/issues/210)
- 里程碑：M20 follow-up
- 分支：`fys-dev/m20-issue-210-docker-image-cache-runtime`
- 日期：2026-04-27

## 背景

当前三端镜像虽然已经支持本地构建、推送和 ECS 拉取，但 Dockerfile 仍存在重复安装依赖、运行镜像携带完整 monorepo 源码的问题。`web` 与 `admin` 都是 Next 应用，公共依赖层重复明显；`server` 也可以进一步裁剪为生产依赖与构建产物。

## 本次目标

- 将 `web/admin/server` Dockerfile 调整为多阶段构建。
- 让 `web/admin` 运行镜像使用 Next standalone 产物启动。
- 让 `server` 运行镜像只携带生产依赖、`dist` 与必要 RAG 资源。
- 增加 BuildKit registry cache 配置，减少后续热构建成本。
- 补充 `.dockerignore`，降低 build context。

## 非目标

- 不改变三端独立镜像与 Docker Compose 服务拓扑。
- 不引入公共依赖运行容器。
- 不修改业务接口、页面逻辑或部署域名。

## 实际改动

- `apps/web/Dockerfile` 与 `apps/admin/Dockerfile`
  - 拆为 `base / deps / builder / runner`。
  - `deps` 阶段只复制 workspace manifest 与 lockfile，提升依赖层缓存命中率。
  - `runner` 阶段只复制 `.next/standalone`、`.next/static` 与 `public`。
  - 启动命令改为 `node apps/<app>/server.js`。
- `apps/server/Dockerfile`
  - 拆为 `base / runtime-base / deps / builder / runner`。
  - `runtime-base` 保留 CJK 字体安装逻辑。
  - `builder` 中使用 `pnpm --filter @my-resume/server deploy --legacy --prod /prod/server` 装配生产依赖。
  - `runner` 只复制生产依赖、`dist`、`data` 与 `storage`。
- `.dockerignore`
  - 排除 `node_modules`、构建产物、`.data`、`.tmp`、日志、docs、本地环境文件等。
- `deploy/ecs/build-and-push-images.sh`
  - 新增 `--cache-ref` 与 `DEPLOY_DOCKER_CACHE_REF`。
  - buildx 模式自动加入 `--cache-from` 与 `--cache-to`。
  - 默认按服务派生 cache tag，也支持 `{service}` 占位符。
- `deploy/ecs/release-from-local.sh`
  - 透传 `--cache-ref` 与 `DEPLOY_DOCKER_CACHE_REF`。

## 验证记录

- 已执行普通构建：
  - `pnpm build:shared`
  - `pnpm --filter @my-resume/web build`
  - `pnpm --filter @my-resume/admin build`
  - `pnpm --filter @my-resume/server build`
- 已验证 `pnpm --filter @my-resume/server deploy --legacy --prod` 可生成生产依赖目录。
- 已执行脚本语法检查：
  - `bash -n deploy/ecs/build-and-push-images.sh`
  - `bash -n deploy/ecs/release-from-local.sh`
- Docker 本地完整构建曾启动，但因需要先收束 git 分支、提交、合并与 tag，暂未以该未提交状态继续。

## 遇到的问题

- `pnpm deploy --prod` 在 pnpm v10 下默认要求 injected workspace，当前仓库未启用，因此采用 `--legacy --prod`。
- macOS 自带 bash 不支持 `mapfile`，`--cache-ref` 参数组装改为兼容 bash 3 的数组函数。
- Docker 冷构建仍可能受基础镜像和 pnpm 安装网络影响，后续应以 `DEPLOY_BASE_IMAGE` 与 `DEPLOY_DOCKER_CACHE_REF` 共同稳定。

## 后续教程切入点

- 为什么不是把 React/Next 拆成公共运行容器，而是复用 Docker layer。
- Next standalone 在 monorepo 下如何减少运行镜像体积。
- BuildKit registry cache 与 `engine-build` 兜底模式分别适合什么场景。
- 如何用 `docker images`、`docker history`、`docker buildx du` 记录优化前后数据。
