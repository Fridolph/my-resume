# M20 Follow-up：ECS 端口冲突自动清理脚本

## 背景

- 线上发布偶发失败，报错：
  - `Bind for 127.0.0.1:5577 failed: port is already allocated`
- 根因是历史发布使用不同 compose project，旧容器未被当前发布自动回收，导致 `5577/5555/5566` 端口被占用。

## 本次目标

- 新增发布前端口冲突清理脚本，避免重复手工排查和手工 `docker rm -f`。
- 保证发布/回滚流程都能自动执行端口冲突预清理。

## 实际改动

- 新增：`deploy/ecs/pre-release-port-cleanup.sh`
  - 默认扫描端口：`5577/5555/5566`
  - 只清理 `server/web/admin` 旧 compose 项目容器
  - 保留当前 compose project 容器，避免误删当前发布目标
  - 支持 `--port`、`--keep-project`、`--stack-env`、`--dry-run`
- 更新：`deploy/ecs/release.sh`
  - 在 `docker compose up` 前自动执行 `pre-release-port-cleanup.sh`
- 更新：`deploy/ecs/rollback.sh`
  - 回滚时同样自动执行端口冲突预清理
- 更新：`deploy/ecs/lib.sh`
  - 为 `docker compose` 统一追加稳定 `--project-name`
  - 新增 `DEPLOY_COMPOSE_PROJECT_NAME` 支持，默认按域名规范化生成
- 文档：
  - `deploy/ecs/README.md`
  - `deploy/ecs/stack-env-checklist.md`
  - `deploy/templates/stack.env.example`

## 测试与验证

- 语法检查：
  - `bash -n deploy/ecs/lib.sh`
  - `bash -n deploy/ecs/pre-release-port-cleanup.sh`
  - `bash -n deploy/ecs/release.sh`
  - `bash -n deploy/ecs/rollback.sh`
- 干跑建议：
  - `./deploy/ecs/pre-release-port-cleanup.sh --stack-env ./.env.stack.local --dry-run`

## 后续建议

- 在 ECS 的 `stack.env.local` 固定 `DEPLOY_COMPOSE_PROJECT_NAME=my-resume`，减少历史容器碎片化。
- 可增加一个定时清理任务，回收长期不用的旧 release snapshots 与无引用镜像层。
