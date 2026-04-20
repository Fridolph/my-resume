# M20 Issue 199 - build-and-push-images 空参数在 nounset 下报错修复

## 背景
在本地执行镜像构建脚本 `deploy/ecs/build-and-push-images.sh` 时，如果未传 `--public-api-base-url`，脚本会在 `set -u`（nounset）模式下报错：

- `ADMIN_BUILDX_ARGS[@]: unbound variable`

这会导致 admin 镜像构建中断，影响本地镜像更新流程稳定性。

## 本次目标
- 修复空数组参数展开在 `nounset` 下的异常
- 保持构建参数行为与发布流程不变

## 实际改动
- 文件：`deploy/ecs/build-and-push-images.sh`
- 将可选数组参数展开统一改为带默认值形式：
  - `${WEB_BUILD_ARGS[@]-}`
  - `${ADMIN_BUILD_ARGS[@]-}`
  - `${WEB_BUILDX_ARGS[@]-}`
  - `${ADMIN_BUILDX_ARGS[@]-}`

## Review 记录
- 方案为最小改动，不改构建参数语义，仅修复 `nounset` 兼容性
- 同时覆盖 engine/buildx 两条路径，避免后续同类问题

## 测试与验证
- 已执行（不传 `--public-api-base-url`）：
  - `./deploy/ecs/build-and-push-images.sh --tag v2.2.7 --server-image local/my-resume-server --web-image local/my-resume-web --admin-image local/my-resume-admin --web-server-api-base-url http://server:5577 --dry-run`
- 已执行（传入 `--public-api-base-url`）：
  - `./deploy/ecs/build-and-push-images.sh --tag v2.2.7 --server-image local/my-resume-server --web-image local/my-resume-web --admin-image local/my-resume-admin --public-api-base-url http://localhost:5577 --web-server-api-base-url http://server:5577 --dry-run`
- 两条路径均已通过，脚本不再报 `unbound variable`

## 后续教程切入点
- `set -u` 在发布脚本中的常见坑（空数组、可选参数）
- 如何用最小变更做发布脚本鲁棒性补丁
