# M20 Follow-up：本地一键镜像构建与 ECS 发布脚本

## 背景

- 当前仓库已有：
  - 本地镜像构建推送脚本：`deploy/ecs/build-and-push-images.sh`
  - 服务器发布脚本：`deploy/ecs/release.sh`
- 但本地到 ECS 的完整发布链路仍需手动串联，容易出现版本 tag、镜像 tag 与发布 tag 不一致。

## 本次目标

- 新增一个本地一键入口，串联：
  1. 版本/tag 对齐
  2. 本地镜像构建与推送
  3. SSH 触发 ECS 发布
  4. 发布后公网验收

## 实际改动

- 新增：`deploy/ecs/release-from-local.sh`
  - 支持 `--version` 自动归一为 `v*` tag
  - 支持自动创建并 push tag（可关闭）
  - 读取 `stack env` 后自动解析镜像仓库、API 域名与部署目录
  - 本地构建推送后，通过 SSH 调用 ECS `release.sh`
  - 默认附带公网域名健康检查
- 增强：`deploy/ecs/build-and-push-images.sh`
  - 除 `--image-prefix` 外，新增显式镜像参数：
    - `--server-image`
    - `--web-image`
    - `--admin-image`
  - 兼容 server/web/admin 分仓场景
  - `--dry-run` 下不再强依赖本机已安装 docker/buildx
- 文档：`deploy/ecs/README.md`
  - 增加显式镜像示例
  - 增加本地一键发布示例
- 根脚本：`package.json`
  - 新增 `deploy:ecs:one-click`

## 测试与验证

- 脚本语法检查：
  - `bash -n deploy/ecs/build-and-push-images.sh`
  - `bash -n deploy/ecs/release-from-local.sh`
- 干跑验证：
  - `./deploy/ecs/release-from-local.sh --version 2.2.3 --stack-env .env.stack.local --ecs-host 127.0.0.1 --dry-run`
  - 验证通过：完整打印“tag 对齐 → 镜像构建 → SSH 发布 → 公网检查”链路

## 后续建议

- 在 CI 中增加 `release-from-local.sh --dry-run` 的参数校验任务，避免发布前脚本回归。
- 后续可选增强：
  - 自动读取并提示“当前 main 最新 tag 与目标 tag 差异”
  - 发布完成后自动回写 changelog/发布记录
